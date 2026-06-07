const Medicine = require('../models/Medicine');
const MedicineSale = require('../models/MedicineSale');
const MedicineStockMovement = require('../models/MedicineStockMovement');
const Admission = require('../models/Admission');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const Ledger = require('../models/Ledger');
const DailyIPDEntry = require('../models/DailyIPDEntry');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { generateNumber } = require('../utils/generateNumbers');
const logAudit = require('../utils/auditLogger');
const { sendSuccess } = require('../utils/responseHandler');
const { ROLES } = require('../utils/roles');

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };
const normalizeSaleDate = (date) => {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const readDiscountPercent = (value, label = 'Discount percentage') => {
  if (value === undefined || value === null || value === '') return 0;
  const percent = Number(value);
  if (!Number.isFinite(percent) || percent < 0 || percent > 99 || !Number.isInteger(percent)) {
    throw new Error(`${label} must be a whole number between 0 and 99.`);
  }
  return percent;
};

const buildPurchaseBill = async ({ req, medicine, quantity, previousStock, movementType, referenceModel, referenceId, note }) => {
  const stockAddingDate = req.body.stockAddingDate ? new Date(req.body.stockAddingDate) : new Date();
  const purchaseRate = Number(req.body.purchaseRate !== undefined && req.body.purchaseRate !== '' ? req.body.purchaseRate : (medicine.purchaseRate || 0));
  const subTotal = roundMoney(Number(quantity || 0) * purchaseRate);
  const discountPercent = readDiscountPercent(req.body.discountPercent ?? req.body.discount, 'Purchase discount percentage');
  const discount = roundMoney((subTotal * discountPercent) / 100);
  const tax = roundMoney(Number(req.body.tax || 0));
  const total = roundMoney(Math.max(subTotal - discount + tax, 0));

  return {
    medicine: medicine._id,
    movementType,
    quantity,
    previousStock,
    newStock: medicine.stockQty,
    referenceModel,
    referenceId,
    billNumber: req.body.purchaseBillNumber || await generateNumber(MedicineStockMovement, 'billNumber', 'MPB'),
    stockAddingDate,
    supplier: req.body.supplier || medicine.supplier,
    purchaseRate,
    subTotal,
    discountPercent,
    discount,
    tax,
    total,
    paymentMode: req.body.paymentMode || 'Cash',
    note,
    createdBy: req.user._id
  };
};

const getStockPriority = (medicine) => {
  const stock = Number(medicine.stockQty || 0);
  const reorderLevel = Number(medicine.reorderLevel || 10);
  if (stock <= 0) return { label: 'Immediate', rank: 1, reason: 'Out of stock' };
  if (stock < 5) return { label: 'High', rank: 2, reason: 'Less than 5 in stock' };
  if (stock < 10) return { label: 'Medium', rank: 3, reason: 'Less than 10 in stock' };
  if (stock <= reorderLevel) return { label: 'Low', rank: 4, reason: `Below reorder level (${reorderLevel})` };
  return { label: 'OK', rank: 99, reason: 'Sufficient stock' };
};

const decorateMedicine = (medicine) => {
  const obj = medicine.toObject ? medicine.toObject() : { ...medicine };
  obj.stockPriority = getStockPriority(obj);
  return obj;
};

const buildMedicineQuery = (queryParams) => {
  const { search, composition, status, stockFilter } = queryParams;
  const query = {};
  if (status) query.status = status;
  if (composition) query.composition = { $regex: composition, $options: 'i' };
  if (search) {
    query.$or = [
      { marketName: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { composition: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { batchNo: { $regex: search, $options: 'i' } }
    ];
  }
  if (stockFilter === 'out') query.stockQty = { $lte: 0 };
  if (stockFilter === 'below5') query.stockQty = { $gt: 0, $lt: 5 };
  if (stockFilter === 'below10') query.stockQty = { $gt: 0, $lt: 10 };
  return query;
};

const getDashboard = asyncHandler(async (req, res) => {
  const todayRange = { $gte: startOfToday(), $lte: endOfToday() };
  const [medicines, recentSales, todaySalesAgg, expiringSoon] = await Promise.all([
    Medicine.find({ status: 'Active' }).sort({ marketName: 1 }),
    MedicineSale.find().populate('patient admission preparedBy').sort({ createdAt: -1 }).limit(8),
    MedicineSale.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, date: todayRange } },
      { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$total' } } }
    ]),
    Medicine.find({
      status: 'Active',
      stockQty: { $gt: 0 },
      expiryDate: { $gte: new Date(), $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) }
    }).sort({ expiryDate: 1 }).limit(10)
  ]);

  const decorated = medicines.map(decorateMedicine);
  const orderSuggestions = decorated
    .filter((m) => m.stockPriority.rank < 99)
    .sort((a, b) => a.stockPriority.rank - b.stockPriority.rank || Number(a.stockQty || 0) - Number(b.stockQty || 0))
    .slice(0, 50);

  const compositionSummary = Object.values(decorated.reduce((acc, med) => {
    const key = (med.composition || 'Unknown').trim();
    if (!acc[key]) acc[key] = { composition: key, totalStock: 0, medicineCount: 0, marketNames: [] };
    acc[key].totalStock += Number(med.stockQty || 0);
    acc[key].medicineCount += 1;
    acc[key].marketNames.push(med.marketName);
    return acc;
  }, {})).sort((a, b) => a.composition.localeCompare(b.composition));

  const totals = decorated.reduce((acc, med) => {
    acc.totalStockQty += Number(med.stockQty || 0);
    acc.inventoryValue += Number(med.stockQty || 0) * Number(med.purchaseRate || 0);
    if (Number(med.stockQty || 0) <= 0) acc.outOfStock += 1;
    if (Number(med.stockQty || 0) > 0 && Number(med.stockQty || 0) < 5) acc.belowFive += 1;
    if (Number(med.stockQty || 0) > 0 && Number(med.stockQty || 0) < 10) acc.belowTen += 1;
    return acc;
  }, { totalMedicines: decorated.length, totalStockQty: 0, inventoryValue: 0, outOfStock: 0, belowFive: 0, belowTen: 0 });

  sendSuccess(res, 'Medical store dashboard fetched.', {
    totals: {
      ...totals,
      todayMedicineBills: todaySalesAgg[0]?.count || 0,
      todayMedicineRevenue: todaySalesAgg[0]?.revenue || 0,
      expiringSoon: expiringSoon.length
    },
    orderSuggestions,
    expiringSoon: expiringSoon.map(decorateMedicine),
    compositionSummary,
    recentSales
  });
});

const getMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find(buildMedicineQuery(req.query)).populate('createdBy updatedBy', 'name email role').sort({ marketName: 1, expiryDate: 1 });
  sendSuccess(res, 'Medicines fetched.', medicines.map(decorateMedicine));
});

const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('createdBy updatedBy', 'name email role');
  if (!medicine) { res.status(404); throw new Error('Medicine not found.'); }
  const movements = await MedicineStockMovement.find({ medicine: medicine._id }).populate('createdBy', 'name email').sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, 'Medicine fetched.', { medicine: decorateMedicine(medicine), movements });
});

const createMedicine = asyncHandler(async (req, res) => {
  if (!req.body.marketName || !req.body.composition) {
    res.status(400);
    throw new Error('Market name and composition are required.');
  }

  try {
    readDiscountPercent(req.body.discountPercent ?? req.body.discount, 'Purchase discount percentage');
  } catch (error) {
    res.status(400);
    throw error;
  }

  const stockAddingDate = req.body.stockAddingDate ? new Date(req.body.stockAddingDate) : new Date();
  const medicine = await Medicine.create({
    ...req.body,
    stockAddingDate,
    lastStockAddedAt: Number(req.body.stockQty || 0) > 0 ? stockAddingDate : undefined,
    saleRate: req.body.saleRate !== undefined ? req.body.saleRate : (req.body.mrp || 0),
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  let purchaseBill = null;
  if (Number(medicine.stockQty || 0) > 0) {
    purchaseBill = await MedicineStockMovement.create(await buildPurchaseBill({
      req,
      medicine,
      quantity: medicine.stockQty,
      previousStock: 0,
      movementType: 'Opening',
      referenceModel: 'Medicine',
      referenceId: String(medicine._id),
      note: req.body.note || 'Opening stock while creating medicine'
    }));
  }

  await logAudit({ req, action: 'Medicine Created', module: 'Medical Store', recordId: medicine._id, newData: { medicine: medicine.toObject(), purchaseBill: purchaseBill?.toObject?.() } });
  sendSuccess(res, 'Medicine created.', { medicine: decorateMedicine(medicine), purchaseBill }, 201);
});

const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) { res.status(404); throw new Error('Medicine not found.'); }

  const oldData = medicine.toObject();
  const protectedFields = ['stockQty', 'createdBy'];
  protectedFields.forEach((field) => delete req.body[field]);
  Object.assign(medicine, req.body, { updatedBy: req.user._id });
  await medicine.save();

  await logAudit({ req, action: 'Medicine Updated', module: 'Medical Store', recordId: medicine._id, oldData, newData: medicine.toObject() });
  sendSuccess(res, 'Medicine updated.', decorateMedicine(medicine));
});

const addStock = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) { res.status(404); throw new Error('Medicine not found.'); }

  const quantity = Number(req.body.quantity || 0);
  if (quantity <= 0) { res.status(400); throw new Error('Quantity must be greater than 0.'); }

  try {
    readDiscountPercent(req.body.discountPercent ?? req.body.discount, 'Purchase discount percentage');
  } catch (error) {
    res.status(400);
    throw error;
  }

  const previousStock = Number(medicine.stockQty || 0);
  const stockAddingDate = req.body.stockAddingDate ? new Date(req.body.stockAddingDate) : new Date();
  medicine.stockQty = previousStock + quantity;
  ['purchaseRate', 'mrp', 'saleRate', 'batchNo', 'expiryDate', 'supplier', 'rackNo', 'reorderLevel'].forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== '') medicine[field] = req.body[field];
  });
  medicine.stockAddingDate = stockAddingDate;
  medicine.lastStockAddedAt = stockAddingDate;
  medicine.updatedBy = req.user._id;
  await medicine.save();

  const purchaseBill = await MedicineStockMovement.create(await buildPurchaseBill({
    req,
    medicine,
    quantity,
    previousStock,
    movementType: 'Add Stock',
    referenceModel: 'Manual',
    referenceId: String(medicine._id),
    note: req.body.note || 'Stock added'
  }));

  await logAudit({ req, action: 'Medicine Stock Added', module: 'Medical Store', recordId: medicine._id, newData: { quantity, previousStock, newStock: medicine.stockQty, purchaseBill: purchaseBill.toObject() } });
  sendSuccess(res, 'Stock added and purchase bill generated.', { medicine: decorateMedicine(medicine), purchaseBill });
});

const calculateSale = (rawItems, medicinesById, body) => {
  const items = rawItems.map((raw) => {
    const medicine = medicinesById[String(raw.medicine)];
    const quantity = Number(raw.quantity || 0);
    const rate = Number(raw.rate !== undefined && raw.rate !== '' ? raw.rate : (medicine.saleRate || medicine.mrp || 0));
    const discountPercent = readDiscountPercent(raw.discountPercent ?? raw.discount, 'Item discount percentage');
    const tax = roundMoney(Number(raw.tax || 0));
    const lineAmount = roundMoney(quantity * rate);
    const discount = roundMoney((lineAmount * discountPercent) / 100);
    const total = roundMoney(Math.max(lineAmount - discount + tax, 0));
    return {
      medicine: medicine._id,
      marketName: medicine.marketName,
      composition: medicine.composition,
      batchNo: medicine.batchNo,
      quantity,
      rate,
      mrp: medicine.mrp || 0,
      discountPercent,
      discount,
      tax,
      total
    };
  });

  const subTotal = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const discountPercent = readDiscountPercent(body.discountPercent ?? body.discount, 'Bill discount percentage');
  const discount = roundMoney((subTotal * discountPercent) / 100);
  const total = roundMoney(Math.max(subTotal - discount + Number(body.tax || 0), 0));
  const paidAmount = roundMoney(Number(body.paidAmount || 0));
  const balanceAmount = roundMoney(Math.max(total - paidAmount, 0));
  const status = paidAmount <= 0 ? 'Credit' : balanceAmount === 0 ? 'Paid' : 'Partially Paid';
  return { items, subTotal, discountPercent, discount, total, paidAmount, balanceAmount, status };
};

const ensureStockAvailable = async (rawItems) => {
  const requestedByMedicine = rawItems.reduce((acc, item) => {
    if (!item.medicine) return acc;
    acc[String(item.medicine)] = (acc[String(item.medicine)] || 0) + Number(item.quantity || 0);
    return acc;
  }, {});

  const ids = Object.keys(requestedByMedicine);
  const medicines = await Medicine.find({ _id: { $in: ids }, status: 'Active' });
  const medicinesById = medicines.reduce((acc, med) => ({ ...acc, [String(med._id)]: med }), {});

  for (const id of ids) {
    const medicine = medicinesById[id];
    if (!medicine) throw new Error('One selected medicine is inactive or not found.');
    const requestedQty = requestedByMedicine[id];
    if (requestedQty <= 0) throw new Error('Every medicine quantity must be greater than 0.');
    if (Number(medicine.stockQty || 0) < requestedQty) {
      throw new Error(`${medicine.marketName} has only ${medicine.stockQty} ${medicine.unit || 'pcs'} in stock.`);
    }
  }

  return { requestedByMedicine, medicinesById };
};

const createLinkedInvoiceAndReceipt = async ({ req, sale, patient, admission }) => {
  const invoiceStatus = sale.paidAmount <= 0 ? 'Draft' : sale.balanceAmount === 0 ? 'Paid' : 'Partially Paid';
  const invoice = await Invoice.create({
    invoiceNumber: await generateNumber(Invoice, 'invoiceNumber', 'INV'),
    invoiceType: 'Medicine Sale',
    patient,
    admission,
    date: sale.date,
    items: sale.items.map((item) => ({
      serviceName: `Medicine: ${item.marketName}${item.batchNo ? ` (${item.batchNo})` : ''}`,
      quantity: item.quantity,
      rate: item.rate,
      discount: item.discount,
      tax: item.tax,
      total: item.total
    })),
    subTotal: sale.subTotal,
    discount: sale.discount,
    tax: sale.tax,
    total: sale.total,
    paidAmount: sale.paidAmount,
    balanceAmount: sale.balanceAmount,
    paymentMode: sale.paymentMode,
    status: invoiceStatus,
    notes: `Auto generated from medicine bill ${sale.billNumber}`,
    preparedBy: req.user._id
  });

  if (sale.paidAmount > 0) {
    let ledger = await Ledger.findOne({ name: 'Cash' });
    if (!ledger) ledger = await Ledger.create({ name: 'Cash', group: 'Cash', createdBy: req.user._id });
    await Transaction.create({
      voucherNumber: await generateNumber(Transaction, 'voucherNumber', 'VCH'),
      voucherType: 'Receipt',
      ledger: ledger._id,
      patient,
      admission,
      invoice: invoice._id,
      amount: sale.paidAmount,
      paymentMode: sale.paymentMode || 'Cash',
      description: `Medicine bill payment ${sale.billNumber}`,
      createdBy: req.user._id
    });
  }

  return invoice;
};

const addToAdmissionDailyBill = async ({ req, sale, admissionDoc }) => {
  if (!admissionDoc) return null;
  const date = normalizeSaleDate(sale.date);
  let entry = await DailyIPDEntry.findOne({ admission: admissionDoc._id, date });

  if (entry) {
    entry.medicineCharge = Number(entry.medicineCharge || 0) + Number(sale.total || 0);
    entry.notes = `${entry.notes || ''}${entry.notes ? '\n' : ''}Medicine bill ${sale.billNumber} added: ₹${sale.total}`;
    await entry.save();
  } else {
    entry = await DailyIPDEntry.create({
      admission: admissionDoc._id,
      patient: admissionDoc.patient?._id || admissionDoc.patient,
      doctor: admissionDoc.assignedDoctor?._id || admissionDoc.assignedDoctor,
      date,
      bedRent: 0,
      medicineCharge: sale.total,
      notes: `Medicine bill ${sale.billNumber} added to admitted patient bill.`,
      enteredBy: req.user._id
    });
  }

  return entry;
};

const notifyLowStockAfterSale = async ({ medicinesById, requestedByMedicine, req }) => {
  const lowStock = Object.values(medicinesById)
    .filter((medicine) => requestedByMedicine[String(medicine._id)] !== undefined)
    .map(decorateMedicine)
    .filter((medicine) => medicine.stockPriority.rank < 99);

  if (lowStock.length) {
    await Notification.create({
      title: 'Medicine stock reorder required',
      message: `${lowStock.length} medicine(s) need reorder after latest sale: ${lowStock.slice(0, 3).map((m) => `${m.marketName} (${m.stockPriority.label})`).join(', ')}`,
      module: 'Medical Store',
      targetRoles: [ROLES.ADMIN, ROLES.MEDICAL_STORE],
      createdBy: req.user._id
    });
  }
};

const createSale = asyncHandler(async (req, res) => {
  const rawItems = (req.body.items || []).filter((item) => item?.medicine && Number(item.quantity || 0) > 0);
  if (!rawItems.length) { res.status(400); throw new Error('At least one medicine item is required.'); }

  let admissionDoc = null;
  let patient = req.body.patient || undefined;
  if (req.body.saleType === 'IPD') {
    if (!req.body.admission) { res.status(400); throw new Error('Admission is required for IPD medicine bill.'); }
    admissionDoc = await Admission.findById(req.body.admission).populate('patient assignedDoctor');
    if (!admissionDoc) { res.status(400); throw new Error('Valid admission is required.'); }
    if (['Discharged', 'Cancelled'].includes(admissionDoc.status)) {
      res.status(400);
      throw new Error('Medicine cannot be billed to discharged/cancelled admission.');
    }
    patient = admissionDoc.patient?._id || admissionDoc.patient;
  }

  try {
    readDiscountPercent(req.body.discountPercent ?? req.body.discount, 'Bill discount percentage');
    rawItems.forEach((item) => readDiscountPercent(item.discountPercent ?? item.discount, 'Item discount percentage'));
  } catch (error) {
    res.status(400);
    throw error;
  }

  const { requestedByMedicine, medicinesById } = await ensureStockAvailable(rawItems);
  const calc = calculateSale(rawItems, medicinesById, req.body);
  const sale = await MedicineSale.create({
    billNumber: req.body.billNumber || await generateNumber(MedicineSale, 'billNumber', 'MSB'),
    saleType: req.body.saleType || 'Outsider',
    patient,
    admission: admissionDoc?._id || req.body.admission || undefined,
    outsiderName: req.body.outsiderName,
    outsiderMobile: req.body.outsiderMobile,
    date: req.body.date || new Date(),
    paymentMode: req.body.paymentMode || 'Cash',
    discountPercent: calc.discountPercent,
    discount: calc.discount,
    tax: Number(req.body.tax || 0),
    notes: req.body.notes,
    preparedBy: req.user._id,
    ...calc
  });

  for (const [medicineId, quantity] of Object.entries(requestedByMedicine)) {
    const medicine = medicinesById[medicineId];
    const previousStock = Number(medicine.stockQty || 0);
    medicine.stockQty = previousStock - quantity;
    medicine.updatedBy = req.user._id;
    await medicine.save();

    await MedicineStockMovement.create({
      medicine: medicine._id,
      movementType: 'Sale',
      quantity: -quantity,
      previousStock,
      newStock: medicine.stockQty,
      referenceModel: 'MedicineSale',
      referenceId: String(sale._id),
      note: `Sold in bill ${sale.billNumber}`,
      createdBy: req.user._id
    });
  }

  const invoice = await createLinkedInvoiceAndReceipt({ req, sale, patient, admission: sale.admission });
  const dailyEntry = await addToAdmissionDailyBill({ req, sale, admissionDoc });
  sale.invoice = invoice._id;
  if (dailyEntry) sale.dailyIpdEntry = dailyEntry._id;
  await sale.save();

  await notifyLowStockAfterSale({ medicinesById, requestedByMedicine, req });
  await logAudit({ req, action: 'Medicine Sale Created', module: 'Medical Store', recordId: sale._id, newData: sale.toObject() });

  const populated = await MedicineSale.findById(sale._id).populate('patient admission invoice dailyIpdEntry preparedBy');
  sendSuccess(res, 'Medicine bill created and stock deducted.', populated, 201);
});

const getSales = asyncHandler(async (req, res) => {
  const { search, saleType, status, from, to } = req.query;
  const query = {};
  if (saleType) query.saleType = saleType;
  if (status) query.status = status;
  if (from || to) query.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) {
    query.$or = [
      { billNumber: { $regex: search, $options: 'i' } },
      { outsiderName: { $regex: search, $options: 'i' } },
      { outsiderMobile: { $regex: search, $options: 'i' } }
    ];
  }
  const sales = await MedicineSale.find(query).populate('patient admission invoice preparedBy').sort({ createdAt: -1 });
  sendSuccess(res, 'Medicine sales fetched.', sales);
});

const getSale = asyncHandler(async (req, res) => {
  const sale = await MedicineSale.findById(req.params.id).populate('patient admission invoice dailyIpdEntry preparedBy cancelledBy items.medicine');
  if (!sale) { res.status(404); throw new Error('Medicine sale not found.'); }
  sendSuccess(res, 'Medicine sale fetched.', sale);
});

const cancelSale = asyncHandler(async (req, res) => {
  const sale = await MedicineSale.findById(req.params.id);
  if (!sale) { res.status(404); throw new Error('Medicine sale not found.'); }
  if (sale.status === 'Cancelled') { res.status(400); throw new Error('Medicine sale is already cancelled.'); }

  for (const item of sale.items) {
    const medicine = await Medicine.findById(item.medicine);
    if (!medicine) continue;
    const previousStock = Number(medicine.stockQty || 0);
    medicine.stockQty = previousStock + Number(item.quantity || 0);
    medicine.updatedBy = req.user._id;
    await medicine.save();
    await MedicineStockMovement.create({
      medicine: medicine._id,
      movementType: 'Sale Cancel',
      quantity: item.quantity,
      previousStock,
      newStock: medicine.stockQty,
      referenceModel: 'MedicineSale',
      referenceId: String(sale._id),
      note: `Sale cancelled: ${sale.billNumber}`,
      createdBy: req.user._id
    });
  }

  if (sale.invoice) {
    await Invoice.findByIdAndUpdate(sale.invoice, {
      status: 'Cancelled',
      cancelReason: req.body.cancelReason || `Medicine bill ${sale.billNumber} cancelled`
    });
  }

  if (sale.dailyIpdEntry) {
    const entry = await DailyIPDEntry.findById(sale.dailyIpdEntry);
    if (entry) {
      entry.medicineCharge = Math.max(Number(entry.medicineCharge || 0) - Number(sale.total || 0), 0);
      entry.notes = `${entry.notes || ''}${entry.notes ? '\n' : ''}Medicine bill ${sale.billNumber} cancelled.`;
      await entry.save();
    }
  }

  sale.status = 'Cancelled';
  sale.cancelReason = req.body.cancelReason || 'Cancelled by authorized user';
  sale.cancelledBy = req.user._id;
  sale.cancelledAt = new Date();
  await sale.save();

  await logAudit({ req, action: 'Medicine Sale Cancelled', module: 'Medical Store', recordId: sale._id, newData: { cancelReason: sale.cancelReason } });
  sendSuccess(res, 'Medicine bill cancelled and stock restored.', sale);
});

const getStockBills = asyncHandler(async (req, res) => {
  const { search, from, to } = req.query;
  const query = {
    movementType: { $in: ['Opening', 'Add Stock'] },
    billNumber: { $exists: true, $ne: '' }
  };

  if (from || to) query.stockAddingDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (search) {
    const matchingMedicines = await Medicine.find({
      $or: [
        { marketName: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { composition: { $regex: search, $options: 'i' } },
        { batchNo: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');

    query.$or = [
      { billNumber: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } },
      { note: { $regex: search, $options: 'i' } },
      { medicine: { $in: matchingMedicines.map((medicine) => medicine._id) } }
    ];
  }

  const bills = await MedicineStockMovement.find(query)
    .populate('medicine createdBy', 'marketName genericName composition batchNo unit company supplier name email role')
    .sort({ stockAddingDate: -1, createdAt: -1 });
  sendSuccess(res, 'Medicine purchase/add-stock bills fetched.', bills);
});

const getStockBill = asyncHandler(async (req, res) => {
  const bill = await MedicineStockMovement.findOne({
    _id: req.params.id,
    movementType: { $in: ['Opening', 'Add Stock'] },
    billNumber: { $exists: true, $ne: '' }
  }).populate('medicine createdBy', 'marketName genericName composition batchNo unit company supplier name email role');

  if (!bill) { res.status(404); throw new Error('Purchase/add-stock bill not found.'); }
  sendSuccess(res, 'Medicine purchase/add-stock bill fetched.', bill);
});

const getCompositionAvailability = asyncHandler(async (req, res) => {
  const { composition } = req.query;
  const query = { status: 'Active' };
  if (composition) query.composition = { $regex: composition, $options: 'i' };

  const rows = await Medicine.find(query).sort({ composition: 1, marketName: 1 });
  const grouped = Object.values(rows.map(decorateMedicine).reduce((acc, medicine) => {
    const key = medicine.composition || 'Unknown';
    if (!acc[key]) acc[key] = { composition: key, totalStock: 0, medicines: [] };
    acc[key].totalStock += Number(medicine.stockQty || 0);
    acc[key].medicines.push(medicine);
    return acc;
  }, {}));

  sendSuccess(res, 'Composition-wise availability fetched.', grouped);
});

module.exports = {
  getDashboard,
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  addStock,
  createSale,
  getSales,
  getSale,
  cancelSale,
  getStockBills,
  getStockBill,
  getCompositionAvailability
};
import { Alert, Button, Card, Col, DatePicker, Descriptions, Divider, Form, Input, InputNumber, message, Modal, Row, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FiFileText, FiPackage, FiPlus, FiPrinter, FiRefreshCcw, FiShoppingCart } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import StatCard from '../../components/StatCard.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import { formatDate } from '../../utils/formatDate.js';

const priorityColors = {
  Immediate: 'red',
  High: 'volcano',
  Medium: 'orange',
  Low: 'gold',
  OK: 'green'
};

const dosageOptions = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Other'].map((value) => ({ label: value, value }));
const paymentOptions = ['Cash', 'Bank', 'UPI', 'Card', 'Cheque', 'Other'].map((value) => ({ label: value, value }));

const priorityTag = (priority) => <Tag color={priorityColors[priority?.label] || 'default'}>{priority?.label || 'OK'}</Tag>;
const money = (value) => `₹${Number(value || 0).toFixed(2)}`;
const safe = (value) => String(value ?? '-').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

const openPrintWindow = (title, bodyHtml) => {
  const printWindow = window.open('', '_blank', 'width=950,height=750');
  if (!printWindow) {
    message.error('Please allow popup to print invoice.');
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>${safe(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1677ff; padding-bottom: 12px; margin-bottom: 18px; }
          .brand { font-size: 22px; font-weight: 700; color: #0f3d7a; }
          .subtitle { color: #6b7280; margin-top: 4px; }
          .badge { border: 1px solid #1677ff; color: #1677ff; padding: 4px 10px; border-radius: 999px; display: inline-block; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 20px; margin-bottom: 18px; }
          .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .value { font-weight: 600; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #eef5ff; }
          .right { text-align: right; }
          .totals { margin-left: auto; margin-top: 16px; width: 320px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; }
          .grand { font-weight: 700; font-size: 16px; color: #0f3d7a; }
          .footer { margin-top: 32px; display: flex; justify-content: space-between; color: #6b7280; font-size: 12px; }
          @media print { button { display: none; } body { margin: 12px; } }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
};

const getSaleCustomer = (sale) => sale?.patient?.name || sale?.outsiderName || 'Walk-in Customer';
const getPurchaseMedicine = (bill) => bill?.medicine?.marketName || bill?.medicineName || '-';

const buildSaleInvoiceHtml = (sale) => `
  <div class="header">
    <div>
      <div class="brand">Medicine Invoice</div>
      <div class="subtitle">Clinic Medical Store</div>
      <div class="badge">${safe(sale?.status || 'Generated')}</div>
    </div>
    <div class="right">
      <div class="label">Bill No</div><div class="value">${safe(sale?.billNumber)}</div>
      <div class="label">Date</div><div class="value">${safe(formatDate(sale?.date))}</div>
    </div>
  </div>
  <div class="grid">
    <div><div class="label">Bill Type</div><div class="value">${safe(sale?.saleType)}</div></div>
    <div><div class="label">Patient / Customer</div><div class="value">${safe(getSaleCustomer(sale))}</div></div>
    <div><div class="label">Mobile</div><div class="value">${safe(sale?.outsiderMobile || sale?.patient?.mobile || '-')}</div></div>
    <div><div class="label">Payment Mode</div><div class="value">${safe(sale?.paymentMode || '-')}</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Medicine</th><th>Batch</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Disc %</th><th class="right">Disc Amt</th><th class="right">Total</th></tr></thead>
    <tbody>
      ${(sale?.items || []).map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${safe(item.marketName)}<br/><small>${safe(item.composition || '')}</small></td>
          <td>${safe(item.batchNo || '-')}</td>
          <td class="right">${safe(item.quantity)}</td>
          <td class="right">${money(item.rate)}</td>
          <td class="right">${Number(item.discountPercent || 0)}%</td>
          <td class="right">${money(item.discount)}</td>
          <td class="right">${money(item.total)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${money(sale?.subTotal)}</span></div>
    <div class="totals-row"><span>Bill Discount (${Number(sale?.discountPercent || 0)}%)</span><span>${money(sale?.discount)}</span></div>
    <div class="totals-row"><span>Tax</span><span>${money(sale?.tax)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>${money(sale?.total)}</span></div>
    <div class="totals-row"><span>Paid</span><span>${money(sale?.paidAmount)}</span></div>
    <div class="totals-row"><span>Balance</span><span>${money(sale?.balanceAmount)}</span></div>
  </div>
  <div class="footer"><span>Generated by medical store system</span><span>Authorized Signature</span></div>
`;

const buildPurchaseBillHtml = (bill) => `
  <div class="header">
    <div>
      <div class="brand">Medicine Purchase / Stock Add Bill</div>
      <div class="subtitle">Clinic Medical Store</div>
      <div class="badge">${safe(bill?.movementType || 'Stock Added')}</div>
    </div>
    <div class="right">
      <div class="label">Bill No</div><div class="value">${safe(bill?.billNumber)}</div>
      <div class="label">Stock Adding Date</div><div class="value">${safe(formatDate(bill?.stockAddingDate || bill?.createdAt))}</div>
    </div>
  </div>
  <div class="grid">
    <div><div class="label">Medicine</div><div class="value">${safe(getPurchaseMedicine(bill))}</div></div>
    <div><div class="label">Composition</div><div class="value">${safe(bill?.medicine?.composition || '-')}</div></div>
    <div><div class="label">Supplier</div><div class="value">${safe(bill?.supplier || bill?.medicine?.supplier || '-')}</div></div>
    <div><div class="label">Payment Mode</div><div class="value">${safe(bill?.paymentMode || '-')}</div></div>
  </div>
  <table>
    <thead><tr><th>Medicine</th><th>Batch</th><th class="right">Added Qty</th><th class="right">Prev Stock</th><th class="right">New Stock</th><th class="right">Purchase Rate</th><th class="right">Total</th></tr></thead>
    <tbody>
      <tr>
        <td>${safe(getPurchaseMedicine(bill))}</td>
        <td>${safe(bill?.medicine?.batchNo || '-')}</td>
        <td class="right">${safe(bill?.quantity)} ${safe(bill?.medicine?.unit || '')}</td>
        <td class="right">${safe(bill?.previousStock)}</td>
        <td class="right">${safe(bill?.newStock)}</td>
        <td class="right">${money(bill?.purchaseRate)}</td>
        <td class="right">${money(bill?.subTotal)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${money(bill?.subTotal)}</span></div>
    <div class="totals-row"><span>Discount (${Number(bill?.discountPercent || 0)}%)</span><span>${money(bill?.discount)}</span></div>
    <div class="totals-row"><span>Tax</span><span>${money(bill?.tax)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>${money(bill?.total)}</span></div>
  </div>
  <div class="footer"><span>${safe(bill?.note || 'Stock added')}</span><span>Authorized Signature</span></div>
`;

export default function MedicalStore() {
  const [medicineForm] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [saleForm] = Form.useForm();
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [saleSearch, setSaleSearch] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [medicineOpen, setMedicineOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [saleInvoiceOpen, setSaleInvoiceOpen] = useState(false);
  const [purchaseInvoiceOpen, setPurchaseInvoiceOpen] = useState(false);
  const [activeSale, setActiveSale] = useState(null);
  const [activePurchaseBill, setActivePurchaseBill] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [stockMedicine, setStockMedicine] = useState(null);
  const [compositionSearch, setCompositionSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [medicineRes, saleRes, purchaseBillRes, admissionRes, dashboardRes] = await Promise.all([
        api.get('/medical-store/medicines', { params: { search: medicineSearch } }),
        api.get('/medical-store/sales', { params: { search: saleSearch } }),
        api.get('/medical-store/stock-bills', { params: { search: purchaseSearch } }),
        api.get('/admissions'),
        api.get('/medical-store/dashboard')
      ]);
      setMedicines(medicineRes.data.data || []);
      setSales(saleRes.data.data || []);
      setPurchaseBills(purchaseBillRes.data.data || []);
      setAdmissions(admissionRes.data.data || []);
      setDashboard(dashboardRes.data.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(), 300);
    return () => clearTimeout(timer);
  }, [medicineSearch, saleSearch, purchaseSearch]);

  const startMedicine = (medicine = null) => {
    setEditingMedicine(medicine);
    medicineForm.resetFields();
    if (medicine) {
      medicineForm.setFieldsValue({
        ...medicine,
        expiryDate: medicine.expiryDate ? dayjs(medicine.expiryDate) : undefined,
        stockAddingDate: medicine.stockAddingDate || medicine.lastStockAddedAt ? dayjs(medicine.stockAddingDate || medicine.lastStockAddedAt) : undefined
      });
    } else {
      medicineForm.setFieldsValue({
        dosageForm: 'Tablet',
        unit: 'pcs',
        stockQty: 0,
        reorderLevel: 10,
        status: 'Active',
        stockAddingDate: dayjs(),
        discountPercent: 0,
        paymentMode: 'Cash'
      });
    }
    setMedicineOpen(true);
  };

  const saveMedicine = async (values) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        expiryDate: values.expiryDate?.toISOString?.(),
        stockAddingDate: values.stockAddingDate?.toISOString?.()
      };
      const { data } = editingMedicine
        ? await api.put(`/medical-store/medicines/${editingMedicine._id}`, payload)
        : await api.post('/medical-store/medicines', payload);
      message.success(editingMedicine ? 'Medicine updated.' : 'Medicine added and opening-stock bill generated.');
      setMedicineOpen(false);
      setEditingMedicine(null);
      if (!editingMedicine && data?.data?.purchaseBill) {
        setActivePurchaseBill({ ...data.data.purchaseBill, medicine: data.data.medicine || data.data.purchaseBill.medicine });
        setPurchaseInvoiceOpen(true);
      }
      load();
    } finally {
      setSaving(false);
    }
  };

  const startStock = (medicine) => {
    setStockMedicine(medicine);
    stockForm.resetFields();
    stockForm.setFieldsValue({
      stockAddingDate: dayjs(),
      purchaseRate: medicine.purchaseRate,
      mrp: medicine.mrp,
      saleRate: medicine.saleRate,
      batchNo: medicine.batchNo,
      expiryDate: medicine.expiryDate ? dayjs(medicine.expiryDate) : undefined,
      reorderLevel: medicine.reorderLevel,
      supplier: medicine.supplier,
      discountPercent: 0,
      tax: 0,
      paymentMode: 'Cash'
    });
    setStockOpen(true);
  };

  const saveStock = async (values) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/medical-store/medicines/${stockMedicine._id}/stock`, {
        ...values,
        expiryDate: values.expiryDate?.toISOString?.(),
        stockAddingDate: values.stockAddingDate?.toISOString?.()
      });
      message.success('Stock added and purchase bill generated.');
      setStockOpen(false);
      setStockMedicine(null);
      if (data?.data?.purchaseBill) {
        setActivePurchaseBill({ ...data.data.purchaseBill, medicine: data.data.medicine || stockMedicine });
        setPurchaseInvoiceOpen(true);
      }
      load();
    } finally {
      setSaving(false);
    }
  };

  const createSale = async (values) => {
    const items = (values.items || []).filter((item) => item?.medicine && Number(item.quantity || 0) > 0);
    if (!items.length) {
      message.error('Add at least one medicine item.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/medical-store/sales', {
        ...values,
        date: values.date?.toISOString?.(),
        items
      });
      message.success('Bill generated and medicine stock deducted.');
      setActiveSale(data.data || null);
      setSaleInvoiceOpen(true);
      saleForm.resetFields();
      saleForm.setFieldsValue({ saleType: 'Outsider', date: dayjs(), paymentMode: 'Cash', discountPercent: 0, tax: 0, items: [{}] });
      load();
    } finally {
      setSaving(false);
    }
  };

  const cancelSale = async (sale) => {
    await api.patch(`/medical-store/sales/${sale._id}/cancel`, { cancelReason: 'Cancelled from medical store dashboard' });
    message.success('Bill cancelled and stock restored.');
    load();
  };

  const openSaleInvoice = async (sale) => {
    setInvoiceLoading(true);
    try {
      const { data } = await api.get(`/medical-store/sales/${sale._id}`);
      setActiveSale(data.data || sale);
      setSaleInvoiceOpen(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const openPurchaseInvoice = async (bill) => {
    setInvoiceLoading(true);
    try {
      const { data } = await api.get(`/medical-store/stock-bills/${bill._id}`);
      setActivePurchaseBill(data.data || bill);
      setPurchaseInvoiceOpen(true);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const printSaleInvoice = (sale = activeSale) => {
    if (!sale) return;
    openPrintWindow(`Medicine Invoice ${sale.billNumber}`, buildSaleInvoiceHtml(sale));
  };

  const printPurchaseInvoice = (bill = activePurchaseBill) => {
    if (!bill) return;
    openPrintWindow(`Purchase Bill ${bill.billNumber}`, buildPurchaseBillHtml(bill));
  };

  const medicineOptions = useMemo(() => medicines
    .filter((medicine) => medicine.status === 'Active')
    .map((medicine) => ({
      label: `${medicine.marketName} | ${medicine.composition} | Stock: ${medicine.stockQty} ${medicine.unit || ''} | ₹${medicine.saleRate || medicine.mrp || 0}`,
      value: medicine._id,
      medicine
    })), [medicines]);

  const compositionRows = useMemo(() => {
    if (!compositionSearch) return dashboard?.compositionSummary || [];
    const search = compositionSearch.toLowerCase();
    const grouped = medicines
      .filter((medicine) => medicine.composition?.toLowerCase().includes(search) || medicine.marketName?.toLowerCase().includes(search))
      .reduce((acc, medicine) => {
        const key = medicine.composition || 'Unknown';
        if (!acc[key]) acc[key] = { composition: key, totalStock: 0, medicineCount: 0, marketNames: [] };
        acc[key].totalStock += Number(medicine.stockQty || 0);
        acc[key].medicineCount += 1;
        acc[key].marketNames.push(medicine.marketName);
        return acc;
      }, {});
    return Object.values(grouped);
  }, [compositionSearch, dashboard, medicines]);

  const medicineColumns = [
    { title: 'Medicine', dataIndex: 'marketName', fixed: 'left', width: 180 },
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Company', dataIndex: 'company', width: 140 },
    { title: 'Batch', dataIndex: 'batchNo', width: 110 },
    { title: 'Expiry', dataIndex: 'expiryDate', render: formatDate, width: 110 },
    { title: 'Stock Added', render: (_, row) => formatDate(row.stockAddingDate || row.lastStockAddedAt), width: 125 },
    { title: 'Stock', dataIndex: 'stockQty', render: (_, row) => `${row.stockQty || 0} ${row.unit || ''}`, width: 110 },
    { title: 'Priority', render: (_, row) => priorityTag(row.stockPriority), width: 120 },
    { title: 'Purchase', dataIndex: 'purchaseRate', render: (value) => <CurrencyText value={value} />, width: 110 },
    { title: 'Sale Rate', dataIndex: 'saleRate', render: (value) => <CurrencyText value={value} />, width: 110 },
    { title: 'Status', dataIndex: 'status', render: (value) => <StatusTag value={value} />, width: 100 },
    {
      title: 'Action',
      fixed: 'right',
      width: 190,
      render: (_, row) => (
        <Space>
          <Button type="link" onClick={() => startMedicine(row)}>Edit</Button>
          <Button type="link" onClick={() => startStock(row)}>Add Stock</Button>
        </Space>
      )
    }
  ];

  const saleColumns = [
    { title: 'Bill No', dataIndex: 'billNumber', width: 150, render: (value, row) => <Button type="link" onClick={() => openSaleInvoice(row)}>{value}</Button> },
    { title: 'Type', dataIndex: 'saleType', width: 100 },
    { title: 'Patient/Customer', render: (_, row) => row.patient?.name || row.outsiderName || '-', width: 180 },
    { title: 'Date', dataIndex: 'date', render: formatDate, width: 110 },
    { title: 'Items', render: (_, row) => row.items?.length || 0, width: 90 },
    { title: 'Disc. %', dataIndex: 'discountPercent', render: (value) => `${Number(value || 0)}%`, width: 90 },
    { title: 'Total', dataIndex: 'total', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Paid', dataIndex: 'paidAmount', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Balance', dataIndex: 'balanceAmount', render: (value) => <CurrencyText value={value} />, width: 120 },
    { title: 'Status', dataIndex: 'status', render: (value) => value === 'Credit' ? <Tag color="orange">Credit</Tag> : <StatusTag value={value} />, width: 110 },
    {
      title: 'Action',
      fixed: 'right',
      width: 210,
      render: (_, row) => (
        <Space>
          <Button type="link" icon={<FiFileText />} loading={invoiceLoading} onClick={() => openSaleInvoice(row)}>Invoice</Button>
          {row.status !== 'Cancelled' ? <ConfirmAction onConfirm={() => cancelSale(row)}>Cancel</ConfirmAction> : null}
        </Space>
      )
    }
  ];

  const purchaseBillColumns = [
    { title: 'Bill No', dataIndex: 'billNumber', width: 160, render: (value, row) => <Button type="link" onClick={() => openPurchaseInvoice(row)}>{value}</Button> },
    { title: 'Medicine', render: (_, row) => getPurchaseMedicine(row), width: 190 },
    { title: 'Stock Adding Date', render: (_, row) => formatDate(row.stockAddingDate || row.createdAt), width: 150 },
    { title: 'Type', dataIndex: 'movementType', width: 110 },
    { title: 'Qty', render: (_, row) => `${row.quantity || 0} ${row.medicine?.unit || ''}`, width: 100 },
    { title: 'Supplier', render: (_, row) => row.supplier || row.medicine?.supplier || '-', width: 160 },
    { title: 'Discount %', dataIndex: 'discountPercent', render: (value) => `${Number(value || 0)}%`, width: 110 },
    { title: 'Total', dataIndex: 'total', render: (value) => <CurrencyText value={value} />, width: 120 },
    {
      title: 'Action',
      fixed: 'right',
      width: 140,
      render: (_, row) => <Button type="link" icon={<FiPrinter />} loading={invoiceLoading} onClick={() => openPurchaseInvoice(row)}>View / Print</Button>
    }
  ];

  const orderColumns = [
    { title: 'Priority', render: (_, row) => priorityTag(row.stockPriority), width: 110 },
    { title: 'Medicine', dataIndex: 'marketName', width: 180 },
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Current Stock', render: (_, row) => `${row.stockQty || 0} ${row.unit || ''}`, width: 120 },
    { title: 'Reorder Level', dataIndex: 'reorderLevel', width: 120 },
    { title: 'Reason', render: (_, row) => row.stockPriority?.reason, width: 220 },
    { title: 'Supplier', dataIndex: 'supplier', width: 160 }
  ];

  const compositionColumns = [
    { title: 'Composition', dataIndex: 'composition', width: 260 },
    { title: 'Available Market Names', render: (_, row) => (row.marketNames || []).join(', '), width: 420 },
    { title: 'Total Stock', dataIndex: 'totalStock', width: 120 },
    { title: 'Brands', dataIndex: 'medicineCount', width: 100 }
  ];

  const saleInvoiceItemColumns = [
    { title: 'Medicine', dataIndex: 'marketName', render: (value, row) => <><strong>{value}</strong><br /><Typography.Text type="secondary">{row.composition}</Typography.Text></>, width: 220 },
    { title: 'Batch', dataIndex: 'batchNo', width: 100 },
    { title: 'Qty', dataIndex: 'quantity', width: 80 },
    { title: 'Rate', dataIndex: 'rate', render: (value) => <CurrencyText value={value} />, width: 100 },
    { title: 'Disc %', dataIndex: 'discountPercent', render: (value) => `${Number(value || 0)}%`, width: 90 },
    { title: 'Disc Amt', dataIndex: 'discount', render: (value) => <CurrencyText value={value} />, width: 100 },
    { title: 'Total', dataIndex: 'total', render: (value) => <CurrencyText value={value} />, width: 110 }
  ];

  const totals = dashboard?.totals || {};

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle="Manage medicine stock, composition-wise alternatives, automatic reorder priorities and IPD/outsider medicine bills."
        extra={<Space wrap><Button icon={<FiRefreshCcw />} onClick={load}>Refresh</Button><Button type="primary" icon={<FiPlus />} onClick={() => startMedicine()}>Add Medicine</Button></Space>}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Medicines" value={totals.totalMedicines} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Out of Stock" value={totals.outOfStock} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Below 5 Stock" value={totals.belowFive} prefix={<FiPackage />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Today Medicine Sale" value={totals.todayMedicineRevenue} prefix="₹" loading={loading} /></Col>
      </Row>

      <Tabs
        defaultActiveKey="billing"
        items={[
          {
            key: 'billing',
            label: 'Medicine Billing',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={9}>
                  <Card className="page-card" title={<Space><FiShoppingCart /> Generate Medicine Bill</Space>}>
                    {/* <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 14 }}
                      message="IPD bill select karne par medicine amount admitted patient ke running IPD bill mein add ho jayega. Outsider bill normal medicine invoice banayega. Discount percentage se calculate hoga aur max 99% allowed hai."
                    /> */}
                    <Form form={saleForm} layout="vertical" onFinish={createSale} initialValues={{ saleType: 'Outsider', date: dayjs(), paymentMode: 'Cash', discountPercent: 0, tax: 0, items: [{}] }}>
                      <Form.Item name="saleType" label="Bill Type" rules={[{ required: true }]}>
                        <Select options={[{ label: 'Admitted Patient (IPD)', value: 'IPD' }, { label: 'Outsider Patient/Customer', value: 'Outsider' }]} />
                      </Form.Item>
                      <Form.Item noStyle shouldUpdate={(prev, cur) => prev.saleType !== cur.saleType}>
                        {({ getFieldValue }) => getFieldValue('saleType') === 'IPD' ? (
                          <Form.Item name="admission" label="Admission" rules={[{ required: true, message: 'Select admission' }]}>
                            <Select
                              showSearch
                              optionFilterProp="label"
                              options={admissions.filter((a) => !['Discharged', 'Cancelled'].includes(a.status)).map((a) => ({ label: `${a.admissionNumber} - ${a.patient?.name || ''}`, value: a._id }))}
                            />
                          </Form.Item>
                        ) : (
                          <>
                            <Form.Item name="outsiderName" label="Outsider Patient/Customer Name" rules={[{ required: true, message: 'Enter customer name' }]}><Input /></Form.Item>
                            <Form.Item name="outsiderMobile" label="Mobile"><Input /></Form.Item>
                          </>
                        )}
                      </Form.Item>
                      <Form.Item name="date" label="Bill Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
                      <Form.List name="items">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Card size="small" key={key} style={{ marginBottom: 10 }}>
                                <Form.Item {...restField} name={[name, 'medicine']} label="Medicine" rules={[{ required: true }]}>
                                  <Select showSearch optionFilterProp="label" options={medicineOptions} />
                                </Form.Item>
                                <Row gutter={8}>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'quantity']} label="Qty" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'rate']} label="Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                                  <Col span={8}><Form.Item {...restField} name={[name, 'discountPercent']} label="Disc. %"><InputNumber min={0} max={99} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
                                </Row>
                                {fields.length > 1 && <Button danger type="link" onClick={() => remove(name)}>Remove Item</Button>}
                              </Card>
                            ))}
                            <Button block onClick={() => add({ discountPercent: 0 })}>Add Another Medicine</Button>
                          </>
                        )}
                      </Form.List>
                      <Divider />
                      <Row gutter={8}>
                        <Col span={12}><Form.Item name="discountPercent" label="Bill Discount %"><InputNumber min={0} max={99} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="tax" label="Bill Tax"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="paidAmount" label="Paid Amount"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="paymentMode" label="Payment Mode"><Select options={paymentOptions} /></Form.Item></Col>
                      </Row>
                      <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
                      <Button type="primary" htmlType="submit" loading={saving} block>Generate Bill & Deduct Stock</Button>
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} lg={15}>
                  <SearchFilterBar search={saleSearch} setSearch={setSaleSearch} onRefresh={load} />
                  <DataTable columns={saleColumns} data={sales} loading={loading} scrollX={1450} />
                </Col>
              </Row>
            )
          },
          {
            key: 'stock',
            label: 'Medicine Stock',
            children: (
              <>
                <SearchFilterBar
                  search={medicineSearch}
                  setSearch={setMedicineSearch}
                  onRefresh={load}
                  filters={[
                    {
                      key: 'quick',
                      placeholder: 'Quick stock filter',
                      options: [
                        { label: 'Out of stock', value: 'out' },
                        { label: 'Less than 5', value: 'below5' },
                        { label: 'Less than 10', value: 'below10' }
                      ],
                      onChange: async (value) => {
                        setLoading(true);
                        try {
                          const { data } = await api.get('/medical-store/medicines', { params: { search: medicineSearch, stockFilter: value } });
                          setMedicines(data.data || []);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }
                  ]}
                />
                <DataTable columns={medicineColumns} data={medicines} loading={loading} scrollX={1850} />
              </>
            )
          },
          {
            key: 'purchaseBills',
            label: 'Purchase / Add Stock Bills',
            children: (
              <>
                <Alert type="success" showIcon style={{ marginBottom: 14 }} message="Add Medicine opening stock ya Add Stock save karte hi yahan purchase/add-stock bill auto generate hoga. Bill No par click karke view/print kar sakte ho." />
                <SearchFilterBar search={purchaseSearch} setSearch={setPurchaseSearch} onRefresh={load} />
                <DataTable columns={purchaseBillColumns} data={purchaseBills} loading={loading} scrollX={1200} />
              </>
            )
          },
          {
            key: 'composition',
            label: 'Composition Finder',
            children: (
              <Card className="page-card">
                <Typography.Paragraph>
                  Same composition ke andar available market-name medicines aur total stock yahan se check kar sakte ho.
                </Typography.Paragraph>
                <Input.Search
                  allowClear
                  placeholder="Search composition, e.g. Paracetamol 500mg"
                  value={compositionSearch}
                  onChange={(e) => setCompositionSearch(e.target.value)}
                  style={{ maxWidth: 420, marginBottom: 16 }}
                />
                <Table rowKey="composition" columns={compositionColumns} dataSource={compositionRows} loading={loading} scroll={{ x: 900 }} />
              </Card>
            )
          },
          {
            key: 'ordering',
            label: 'Auto Ordering Priority',
            children: (
              <Card className="page-card">
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Priority rule: Out of stock = Immediate, stock less than 5 = High, stock less than 10 = Medium, stock below reorder level = Low."
                />
                <Table rowKey="_id" columns={orderColumns} dataSource={dashboard?.orderSuggestions || []} loading={loading} scroll={{ x: 1100 }} />
              </Card>
            )
          }
        ]}
      />

      <FormDrawer title={editingMedicine ? 'Edit Medicine' : 'Add Medicine'} open={medicineOpen} onClose={() => setMedicineOpen(false)} onSubmit={saveMedicine} form={medicineForm} loading={saving} width={720}>
        <Row gutter={12}>
          <Col xs={24} md={12}><Form.Item name="marketName" label="Market Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="genericName" label="Generic Name"><Input /></Form.Item></Col>
          <Col xs={24}><Form.Item name="composition" label="Composition" rules={[{ required: true }]}><Input placeholder="Example: Paracetamol 500mg" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="strength" label="Strength"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="dosageForm" label="Dosage Form"><Select options={dosageOptions} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="company" label="Company"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="batchNo" label="Batch No"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="expiryDate" label="Expiry Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="unit" label="Unit"><Input /></Form.Item></Col>
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="stockQty" label="Opening Stock"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>}
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="stockAddingDate" label="Stock Adding Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>}
          <Col xs={24} md={8}><Form.Item name="purchaseRate" label="Purchase Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="mrp" label="MRP"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="saleRate" label="Sale Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="discountPercent" label="Purchase Discount %"><InputNumber min={0} max={99} precision={0} style={{ width: '100%' }} /></Form.Item></Col>}
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="tax" label="Purchase Tax"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>}
          {!editingMedicine && <Col xs={24} md={8}><Form.Item name="paymentMode" label="Payment Mode"><Select options={paymentOptions} /></Form.Item></Col>}
          <Col xs={24} md={8}><Form.Item name="reorderLevel" label="Reorder Level"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="supplier" label="Supplier"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="rackNo" label="Rack No"><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name="status" label="Status"><Select options={['Active', 'Inactive'].map((value) => ({ label: value, value }))} /></Form.Item></Col>
        </Row>
      </FormDrawer>

      <FormDrawer title={`Add Stock${stockMedicine ? ` - ${stockMedicine.marketName}` : ''}`} open={stockOpen} onClose={() => setStockOpen(false)} onSubmit={saveStock} form={stockForm} loading={saving} width={620}>
        <Alert type="info" showIcon style={{ marginBottom: 14 }} message={`Current stock: ${stockMedicine?.stockQty || 0} ${stockMedicine?.unit || ''}. Save karte hi purchase bill generate hoga.`} />
        <Row gutter={12}>
          <Col xs={24} md={12}><Form.Item name="quantity" label="Add Quantity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="stockAddingDate" label="Stock Adding Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="purchaseRate" label="Purchase Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="mrp" label="MRP"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="saleRate" label="Sale Rate"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="discountPercent" label="Purchase Discount %"><InputNumber min={0} max={99} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="tax" label="Purchase Tax"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="paymentMode" label="Payment Mode"><Select options={paymentOptions} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="reorderLevel" label="Reorder Level"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="batchNo" label="Batch No"><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="expiryDate" label="Expiry Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="supplier" label="Supplier"><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name="rackNo" label="Rack No"><Input /></Form.Item></Col>
        </Row>
        <Form.Item name="note" label="Note"><Input.TextArea rows={2} /></Form.Item>
      </FormDrawer>

      <Modal
        title={`Medicine Invoice${activeSale?.billNumber ? ` - ${activeSale.billNumber}` : ''}`}
        open={saleInvoiceOpen}
        onCancel={() => setSaleInvoiceOpen(false)}
        width={920}
        footer={[
          <Button key="close" onClick={() => setSaleInvoiceOpen(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<FiPrinter />} onClick={() => printSaleInvoice()}>Print Invoice</Button>
        ]}
      >
        {activeSale && (
          <>
            <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bill No">{activeSale.billNumber}</Descriptions.Item>
              <Descriptions.Item label="Date">{formatDate(activeSale.date)}</Descriptions.Item>
              <Descriptions.Item label="Type">{activeSale.saleType}</Descriptions.Item>
              <Descriptions.Item label="Patient/Customer">{getSaleCustomer(activeSale)}</Descriptions.Item>
              <Descriptions.Item label="Payment Mode">{activeSale.paymentMode || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">{activeSale.status}</Descriptions.Item>
            </Descriptions>
            <Table rowKey={(row, index) => row._id || index} columns={saleInvoiceItemColumns} dataSource={activeSale.items || []} pagination={false} scroll={{ x: 820 }} />
            <Card size="small" style={{ marginTop: 16, maxWidth: 360, marginLeft: 'auto' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>Subtotal: <strong>{money(activeSale.subTotal)}</strong></Typography.Text>
                <Typography.Text>Bill Discount ({Number(activeSale.discountPercent || 0)}%): <strong>{money(activeSale.discount)}</strong></Typography.Text>
                <Typography.Text>Tax: <strong>{money(activeSale.tax)}</strong></Typography.Text>
                <Typography.Title level={5} style={{ margin: 0 }}>Total: {money(activeSale.total)}</Typography.Title>
                <Typography.Text>Paid: <strong>{money(activeSale.paidAmount)}</strong></Typography.Text>
                <Typography.Text>Balance: <strong>{money(activeSale.balanceAmount)}</strong></Typography.Text>
              </Space>
            </Card>
          </>
        )}
      </Modal>

      <Modal
        title={`Purchase/Add Stock Bill${activePurchaseBill?.billNumber ? ` - ${activePurchaseBill.billNumber}` : ''}`}
        open={purchaseInvoiceOpen}
        onCancel={() => setPurchaseInvoiceOpen(false)}
        width={820}
        footer={[
          <Button key="close" onClick={() => setPurchaseInvoiceOpen(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<FiPrinter />} onClick={() => printPurchaseInvoice()}>Print Bill</Button>
        ]}
      >
        {activePurchaseBill && (
          <>
            <Descriptions bordered size="small" column={{ xs: 1, md: 2 }} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bill No">{activePurchaseBill.billNumber}</Descriptions.Item>
              <Descriptions.Item label="Stock Adding Date">{formatDate(activePurchaseBill.stockAddingDate || activePurchaseBill.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Medicine">{getPurchaseMedicine(activePurchaseBill)}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{activePurchaseBill.supplier || activePurchaseBill.medicine?.supplier || '-'}</Descriptions.Item>
              <Descriptions.Item label="Added Qty">{activePurchaseBill.quantity} {activePurchaseBill.medicine?.unit || ''}</Descriptions.Item>
              <Descriptions.Item label="Payment Mode">{activePurchaseBill.paymentMode || '-'}</Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="_id"
              columns={[
                { title: 'Medicine', render: () => getPurchaseMedicine(activePurchaseBill) },
                { title: 'Previous Stock', dataIndex: 'previousStock' },
                { title: 'New Stock', dataIndex: 'newStock' },
                { title: 'Purchase Rate', dataIndex: 'purchaseRate', render: (value) => <CurrencyText value={value} /> },
                { title: 'Subtotal', dataIndex: 'subTotal', render: (value) => <CurrencyText value={value} /> }
              ]}
              dataSource={[activePurchaseBill]}
              pagination={false}
              scroll={{ x: 700 }}
            />
            <Card size="small" style={{ marginTop: 16, maxWidth: 360, marginLeft: 'auto' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Text>Subtotal: <strong>{money(activePurchaseBill.subTotal)}</strong></Typography.Text>
                <Typography.Text>Discount ({Number(activePurchaseBill.discountPercent || 0)}%): <strong>{money(activePurchaseBill.discount)}</strong></Typography.Text>
                <Typography.Text>Tax: <strong>{money(activePurchaseBill.tax)}</strong></Typography.Text>
                <Typography.Title level={5} style={{ margin: 0 }}>Total: {money(activePurchaseBill.total)}</Typography.Title>
              </Space>
            </Card>
          </>
        )}
      </Modal>
    </>
  );
}

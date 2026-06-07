require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Ledger = require('./models/Ledger');
const Patient = require('./models/Patient');
const Bed = require('./models/Bed');
const Doctor = require('./models/Doctor');
const Admission = require('./models/Admission');
const DailyIPDEntry = require('./models/DailyIPDEntry');
const Invoice = require('./models/Invoice');
const Transaction = require('./models/Transaction');
const DoctorAssignment = require('./models/DoctorAssignment');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const DocumentUpload = require('./models/DocumentUpload');
const Medicine = require('./models/Medicine');
const MedicineSale = require('./models/MedicineSale');
const MedicineStockMovement = require('./models/MedicineStockMovement');
const { ROLES } = require('./utils/roles');

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(), Ledger.deleteMany(), Patient.deleteMany(), Bed.deleteMany(), Doctor.deleteMany(), Admission.deleteMany(),
    DailyIPDEntry.deleteMany(), Invoice.deleteMany(), Transaction.deleteMany(), DoctorAssignment.deleteMany(), Notification.deleteMany(), AuditLog.deleteMany(), DocumentUpload.deleteMany(), Medicine.deleteMany(), MedicineSale.deleteMany(), MedicineStockMovement.deleteMany()
  ]);

  const admin = await User.create({
    name: 'Admin User', email: 'admin@clinic.com', phone: '9000000001', role: ROLES.ADMIN, department: 'Management',
    password: await User.hashPassword('Admin@123'), firstLogin: false, passwordChanged: true, isActive: true,
    address: 'Clinic Office', dateOfBirth: new Date('1990-01-01'), gender: 'Other', emergencyContactNumber: '9000000099', joiningDate: new Date(), shiftStart: '09:00', shiftEnd: '19:00', verificationStatus: 'Verified', profileCompletionPercentage: 100
  });

  const users = [
    ['Accounts User', 'accounts@clinic.com', ROLES.ACCOUNTS, 'Accounts'],
    ['Reception User', 'reception@clinic.com', ROLES.RECEPTION, 'IPD Desk'],
    ['Doctor Login', 'doctor@clinic.com', ROLES.DOCTOR, 'Clinical'],
    ['Nurse User', 'nurse@clinic.com', ROLES.NURSE, 'Ward'],
    ['Medical Store User', 'medicalstore@clinic.com', ROLES.MEDICAL_STORE, 'Medical Store'],
    ['Auditor User', 'auditor@clinic.com', ROLES.AUDITOR, 'Audit']
  ];
  const createdUsers = [];
  for (const [name, email, role, department] of users) {
    createdUsers.push(await User.create({ name, email, phone: '9000000000', role, department, password: await User.hashPassword('User@1234'), firstLogin: true, passwordChanged: false, isActive: true, createdBy: admin._id, verificationStatus: 'Verification Pending', joiningDate: new Date(), shiftStart: '09:00', shiftEnd: '19:00' }));
  }

  const ledgers = await Ledger.insertMany([
    { name: 'Cash', group: 'Cash', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id },
    { name: 'Bank', group: 'Bank', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id },
    { name: 'Patient Receivable', group: 'Patient Receivable', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id },
    { name: 'Service Income', group: 'Income', openingBalance: 0, balanceType: 'Credit', createdBy: admin._id },
    { name: 'Bed Rent Income', group: 'Income', openingBalance: 0, balanceType: 'Credit', createdBy: admin._id },
    { name: 'Doctor Payable', group: 'Doctor Payable', openingBalance: 0, balanceType: 'Credit', createdBy: admin._id },
    { name: 'Medicine Expense', group: 'Expense', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id },
    { name: 'Nursing Expense', group: 'Expense', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id },
    { name: 'Medicine Sales Income', group: 'Income', openingBalance: 0, balanceType: 'Credit', createdBy: admin._id },
    { name: 'Medicine Purchase Expense', group: 'Expense', openingBalance: 0, balanceType: 'Debit', createdBy: admin._id }
  ]);

  const doctorUser = createdUsers.find((u) => u.role === ROLES.DOCTOR);
  const doctor = await Doctor.create({ name: 'Dr. Anirban Sen', specialization: 'General Medicine', phone: '9876543210', email: 'doctor@clinic.com', status: 'Active', wageType: 'Per Day', wageAmount: 800, user: doctorUser._id, createdBy: admin._id });
  const beds = await Bed.insertMany([
    { bedNumber: 'G-101', wardName: 'General Ward', bedType: 'General', dailyBedRent: 1000, status: 'Available', createdBy: admin._id },
    { bedNumber: 'P-201', wardName: 'Private Ward', bedType: 'Private', dailyBedRent: 2500, status: 'Available', createdBy: admin._id },
    { bedNumber: 'ICU-01', wardName: 'ICU', bedType: 'ICU', dailyBedRent: 5000, status: 'Maintenance', createdBy: admin._id }
  ]);

  const medicines = await Medicine.insertMany([
    { marketName: 'Paracip 500', genericName: 'Paracetamol', composition: 'Paracetamol 500mg', dosageForm: 'Tablet', company: 'Cipla', batchNo: 'PCM-A1', expiryDate: new Date('2027-12-31'), purchaseRate: 1.2, mrp: 2, saleRate: 2, stockQty: 80, unit: 'tablet', reorderLevel: 20, rackNo: 'A-01', createdBy: admin._id, updatedBy: admin._id },
    { marketName: 'Dolo 650', genericName: 'Paracetamol', composition: 'Paracetamol 650mg', dosageForm: 'Tablet', company: 'Micro Labs', batchNo: 'D650-B2', expiryDate: new Date('2027-10-31'), purchaseRate: 1.6, mrp: 2.8, saleRate: 2.8, stockQty: 4, unit: 'tablet', reorderLevel: 20, rackNo: 'A-02', createdBy: admin._id, updatedBy: admin._id },
    { marketName: 'Augmentin 625 Duo', genericName: 'Amoxicillin + Clavulanic Acid', composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', dosageForm: 'Tablet', company: 'GSK', batchNo: 'AUG-C3', expiryDate: new Date('2027-05-31'), purchaseRate: 18, mrp: 27, saleRate: 27, stockQty: 0, unit: 'tablet', reorderLevel: 10, rackNo: 'B-01', createdBy: admin._id, updatedBy: admin._id },
    { marketName: 'Pan 40', genericName: 'Pantoprazole', composition: 'Pantoprazole 40mg', dosageForm: 'Tablet', company: 'Alkem', batchNo: 'PAN-D4', expiryDate: new Date('2027-08-31'), purchaseRate: 5, mrp: 8, saleRate: 8, stockQty: 9, unit: 'tablet', reorderLevel: 15, rackNo: 'C-01', createdBy: admin._id, updatedBy: admin._id }
  ]);
  await MedicineStockMovement.insertMany(medicines.map((medicine) => ({
    medicine: medicine._id,
    movementType: 'Opening',
    quantity: medicine.stockQty,
    previousStock: 0,
    newStock: medicine.stockQty,
    referenceModel: 'Medicine',
    referenceId: String(medicine._id),
    note: 'Seed opening stock',
    createdBy: admin._id
  })));

  const patient = await Patient.create({ registrationNumber: 'PAT202606050001', name: 'Sample Patient', guardianName: 'Sample Guardian', gender: 'Male', age: 42, mobile: '9999999999', address: 'Kolkata', patientType: 'IPD', createdBy: admin._id });
  const admission = await Admission.create({ admissionNumber: 'IPD202606050001', patient: patient._id, bed: beds[0]._id, assignedDoctor: doctor._id, admissionReason: 'Fever and weakness', diagnosis: 'Viral fever', initialDeposit: 2000, createdBy: admin._id });
  beds[0].status = 'Occupied'; beds[0].currentPatient = patient._id; beds[0].currentAdmission = admission._id; await beds[0].save();
  await DoctorAssignment.create({ admission: admission._id, patient: patient._id, doctor: doctor._id, createdBy: admin._id });
  await DailyIPDEntry.create({ admission: admission._id, patient: patient._id, doctor: doctor._id, date: new Date(), bedRent: 1000, dailyDoctorVisitCharge: 500, nursingCharge: 300, medicineCharge: 650, notes: 'Initial daily IPD entry', enteredBy: admin._id });
  const invoice = await Invoice.create({ invoiceNumber: 'INV202606050001', invoiceType: 'Normal', patient: patient._id, admission: admission._id, ledger: ledgers[0]._id, date: new Date(), items: [{ serviceName: 'Admission Package', quantity: 1, rate: 2500, total: 2500 }], subTotal: 2500, total: 2500, paidAmount: 2000, balanceAmount: 500, paymentMode: 'Cash', status: 'Partially Paid', preparedBy: admin._id });
  await Transaction.create({ voucherNumber: 'VCH202606050001', date: new Date(), voucherType: 'Receipt', ledger: ledgers[0]._id, patient: patient._id, admission: admission._id, invoice: invoice._id, amount: 2000, paymentMode: 'Cash', description: 'Sample initial receipt', createdBy: admin._id });
  await Notification.create({ title: 'Welcome to Clinic ERP', message: 'Seed data created successfully.', targetRoles: [ROLES.ADMIN], module: 'System', createdBy: admin._id });

  console.log('Seed completed. Default admin: admin@clinic.com / Admin@123');
  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

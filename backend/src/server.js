require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

connectDB();

const app = express();
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean).map((u) => u.replace(/\/$/, ''));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    callback(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ success: true, message: 'Clinic IPD & Accounts API running.', data: null }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/ledgers', require('./routes/ledgerRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/beds', require('./routes/bedRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/daily-ipd', require('./routes/dailyIpdRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

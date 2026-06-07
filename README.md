# Clinic IPD & Accounts Management System

A complete MERN-based Clinic & Nursing Home ERP starter built from the uploaded requirement document and prompt. It combines **Tally-style accounts**, **IPD admission-to-discharge workflows**, **billing**, **doctor wage/commission**, **employee verification**, **document uploads**, **reports**, **notifications**, and **audit logs**.

## Tech Stack

**Frontend:** React.js, Vite, Ant Design, React Icons, Axios, React Router DOM, Day.js  
**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt.js, Multer, Nodemailer, PDFKit

## Major Features

- JWT login, protected routes, role-based sidebar and API access
- First-login password change workflow
- Forgot/reset password with hashed expiring token and email support
- Employee creation, activation/deactivation, password reset, profile completion, document verification
- Patient registration and patient timeline
- Bed management with occupied/available/maintenance status
- IPD admission, discharge request, discharge calculation, and bed auto-release
- Daily IPD tracking with bed rent, doctor/nursing/medicine/lab/service charges
- Ledger master, voucher/payment/receipt entries, day book, trial balance, balance sheet
- Normal invoices, receipts, cancellation workflow, print view
- Doctor master, assignments, patients, and wage/commission report
- IPD document upload with file type/size validation
- Reports section with date range and keyword filters
- Notification dropdown and notification center
- Audit log for sensitive operations
- Clean hospital-friendly Ant Design UI with desktop/tablet/mobile responsive layout

## Folder Structure

```txt
clinic-ipd-accounts-mern/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      uploads/
      seed.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      api/
      components/
      context/
      pages/
      routes/
      utils/
      App.jsx
      main.jsx
    .env.example
    package.json
```

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env   # Windows CMD
# or: cp .env.example .env
```

Update `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/clinic_ipd_accounts
JWT_SECRET=change_this_super_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_password
EMAIL_FROM="Clinic ERP <no-reply@clinic.com>"
```

Seed default data:

```bash
npm run seed
```

Run backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env   # Windows CMD
# or: cp .env.example .env
npm run dev
```

Frontend URL: `http://localhost:5173`

## Default Login

```txt
Email: admin@clinic.com
Password: Admin@123
Role: Owner/Admin
```

## Seed Users

```txt
Admin:      admin@clinic.com / Admin@123
Accounts:   accounts@clinic.com / User@1234
Reception:  reception@clinic.com / User@1234
Doctor:     doctor@clinic.com / User@1234
Nurse:      nurse@clinic.com / User@1234
Auditor:    auditor@clinic.com / User@1234
```

Sample non-admin employees have `firstLogin=true`, so after first login they are forced to change password.

## API Route Summary

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`
- `POST /api/auth/logout`

### Employees
- `POST /api/employees`
- `GET /api/employees`
- `GET /api/employees/:id`
- `PUT /api/employees/:id`
- `PATCH /api/employees/:id/status`
- `PATCH /api/employees/:id/verify`
- `PATCH /api/employees/:id/reset-password`
- `POST /api/employees/:id/documents`
- `GET /api/employees/:id/profile-pdf`

### Core Modules
- Ledgers: `/api/ledgers`
- Transactions: `/api/transactions`
- Patients: `/api/patients`
- Beds: `/api/beds`
- Admissions: `/api/admissions`
- Daily IPD: `/api/daily-ipd`
- Invoices: `/api/invoices`
- Doctors: `/api/doctors`
- Documents: `/api/documents`
- Reports: `/api/reports/...`
- Notifications: `/api/notifications`
- Audit Logs: `/api/audit-logs`
- Dashboard: `/api/dashboard`

## Role-wise Access Summary

| Role | Access |
| --- | --- |
| Owner/Admin | Full access, approvals, employee management, audit logs, settings |
| Accounts/Billing User | Ledgers, transactions, invoices, reports, payments, patient billing |
| Reception/IPD Desk | Patient registration, admissions, beds, documents, discharge request |
| Doctor | Assigned patients, notes/documents, own wage report |
| Nurse/Ward Staff | Current IPD patients, daily IPD entries, documents |
| Auditor/Viewer | Read-only reports, ledgers, transactions, patients, audit logs |

## Important Implementation Notes

- Files upload to `backend/src/uploads` and are served at `/uploads/...`.
- Code is structured so Cloudinary/S3 can be added later by replacing `uploadMiddleware` and file URL generation.
- Forgotten-password email uses Nodemailer. If SMTP variables are not configured, the backend logs the email content in console for local development.
- Central API responses follow:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

## Production Checklist

Before production, configure strong `JWT_SECRET`, real SMTP, MongoDB Atlas or managed MongoDB, HTTPS, production CORS domain, file storage backup, and database backups.

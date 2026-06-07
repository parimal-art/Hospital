import { Navigate, Route, Routes } from 'react-router-dom';
import React from 'react';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import AppLayout from '../components/AppLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import ChangePassword from '../pages/auth/ChangePassword.jsx';
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import EmployeeManagement from '../pages/employees/EmployeeManagement.jsx';
import EmployeeProfile from '../pages/employees/EmployeeProfile.jsx';
import MyProfile from '../pages/profile/MyProfile.jsx';
import Ledgers from '../pages/ledgers/Ledgers.jsx';
import Transactions from '../pages/transactions/Transactions.jsx';
import Patients from '../pages/patients/Patients.jsx';
import PatientDetails from '../pages/patients/PatientDetails.jsx';
import Beds from '../pages/beds/Beds.jsx';
import Admissions from '../pages/admissions/Admissions.jsx';
import AdmissionDetails from '../pages/admissions/AdmissionDetails.jsx';
import DailyIpdEntries from '../pages/daily-ipd/DailyIpdEntries.jsx';
import Billing from '../pages/billing/Billing.jsx';
import InvoiceDetails from '../pages/billing/InvoiceDetails.jsx';
import Doctors from '../pages/doctors/Doctors.jsx';
import DoctorDetails from '../pages/doctors/DoctorDetails.jsx';
import Documents from '../pages/documents/Documents.jsx';
import ReportsHub from '../pages/reports/ReportsHub.jsx';
import Notifications from '../pages/notifications/Notifications.jsx';
import AuditLogs from '../pages/audit/AuditLogs.jsx';
import Settings from '../pages/settings/Settings.jsx';
import MedicalStore from '../pages/medical-store/MedicalStore.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/employees/:id" element={<EmployeeProfile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/ledgers" element={<Ledgers />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetails />} />
          <Route path="/beds" element={<Beds />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/admissions/:id" element={<AdmissionDetails />} />
          <Route path="/daily-ipd" element={<DailyIpdEntries />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/billing/:id" element={<InvoiceDetails />} />
          <Route path="/medical-store" element={<MedicalStore />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/reports" element={<ReportsHub />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

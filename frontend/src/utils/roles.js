export const ROLES = {
  ADMIN: 'Owner/Admin',
  ACCOUNTS: 'Accounts/Billing User',
  RECEPTION: 'Reception/IPD Desk',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse/Ward Staff',
  AUDITOR: 'Auditor/Viewer'
};

export const roleOptions = Object.values(ROLES).map((role) => ({ label: role, value: role }));

export const canWrite = (user, roles) => user && roles.includes(user.role);

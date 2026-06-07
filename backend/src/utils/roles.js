const ROLES = {
  ADMIN: 'Owner/Admin',
  ACCOUNTS: 'Accounts/Billing User',
  RECEPTION: 'Reception/IPD Desk',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse/Ward Staff',
  AUDITOR: 'Auditor/Viewer'
};

const ROLE_VALUES = Object.values(ROLES);
const WRITE_ROLES = [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.RECEPTION, ROLES.NURSE];
const ADMIN_ONLY = [ROLES.ADMIN];

module.exports = { ROLES, ROLE_VALUES, WRITE_ROLES, ADMIN_ONLY };

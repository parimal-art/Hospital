import { ROLES } from './roles.js';

export const permissions = {
  employees: [ROLES.ADMIN],
  accounting: [ROLES.ADMIN, ROLES.ACCOUNTS],
  patientWrite: [ROLES.ADMIN, ROLES.RECEPTION],
  ipdWrite: [ROLES.ADMIN, ROLES.RECEPTION, ROLES.NURSE],
  reports: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE],
  audit: [ROLES.ADMIN, ROLES.AUDITOR]
};

export const hasPermission = (user, area) => Boolean(user && permissions[area]?.includes(user.role));

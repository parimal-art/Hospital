import { ROLES } from './roles.js';

export const permissions = {
  employees: [ROLES.ADMIN],
  accounting: [ROLES.ADMIN, ROLES.ACCOUNTS],
  patientWrite: [ROLES.ADMIN, ROLES.RECEPTION],
  ipdWrite: [ROLES.ADMIN, ROLES.RECEPTION, ROLES.NURSE],
  medicalStore: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.MEDICAL_STORE],
  reports: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.AUDITOR, ROLES.RECEPTION, ROLES.DOCTOR, ROLES.NURSE, ROLES.MEDICAL_STORE],
  audit: [ROLES.ADMIN, ROLES.AUDITOR]
};

export const hasPermission = (user, area) => Boolean(user && permissions[area]?.includes(user.role));

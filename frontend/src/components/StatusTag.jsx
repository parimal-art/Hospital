import { Tag } from 'antd';
import React from 'react';

const map = {
  Active: 'green', Inactive: 'red', Available: 'green', Occupied: 'red', Maintenance: 'orange',
  Paid: 'green', 'Partially Paid': 'orange', Draft: 'blue', Cancelled: 'red', Posted: 'green',
  Admitted: 'blue', 'Under Treatment': 'cyan', 'Discharge Requested': 'orange', Discharged: 'green',
  Verified: 'green', Rejected: 'red', 'Document Pending': 'orange', 'Verification Pending': 'blue', 'New Employee': 'default'
};

export default function StatusTag({ value }) {
  return <Tag color={map[value] || 'default'}>{value || '-'}</Tag>;
}

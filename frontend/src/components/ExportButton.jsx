import { Button } from 'antd';
import React from 'react';
import { FiDownload } from 'react-icons/fi';

export default function ExportButton({ rows = [], filename = 'export.csv' }) {
  const exportCsv = () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object');
    const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  return <Button icon={<FiDownload />} onClick={exportCsv}>Export CSV</Button>;
}

import { Typography } from 'antd';
import React from 'react';

export default function PageHeader({ title, subtitle, extra }) {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={3} className="page-title">{title}</Typography.Title>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div>{extra}</div>
    </div>
  );
}

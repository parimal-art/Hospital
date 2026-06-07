import { Card, Statistic } from 'antd';
import React from 'react';

export default function StatCard({ title, value, prefix, suffix, loading }) {
  return <Card className="stat-card" loading={loading}><Statistic title={title} value={value} prefix={prefix} suffix={suffix} /></Card>;
}

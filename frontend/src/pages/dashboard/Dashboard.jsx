import { Card, Col, List, Row, Skeleton, Typography } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { FiActivity, FiBriefcase, FiCreditCard, FiFileText, FiHome, FiUsers } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const load = async () => { setLoading(true); try { const res = await api.get('/dashboard'); setData(res.data.data); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const t = data?.totals || {};
  return (
    <>
      <PageHeader title={`${user?.role || ''} Dashboard`} subtitle="Live operational, billing and IPD summary for your role." />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Employees" value={t.employees} prefix={<FiUsers />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Patients" value={t.patients} prefix={<FiActivity />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Current IPD" value={t.currentIpd} prefix={<FiHome />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Today Admissions" value={t.todayAdmissions} prefix={<FiFileText />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Today Discharges" value={t.todayDischarges} prefix={<FiFileText />} loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Today Revenue" value={t.todayRevenue} prefix="₹" loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Pending Dues" value={t.pendingDues} prefix="₹" loading={loading} /></Col>
        <Col xs={24} sm={12} lg={6}><StatCard title="Total Doctors" value={t.doctors} prefix={<FiBriefcase />} loading={loading} /></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 18 }}>
        <Col xs={24} lg={12}>
          <Card className="page-card" title="Recent Payments">
            {loading ? <Skeleton /> : <List dataSource={data?.recentPayments || []} renderItem={(item) => <List.Item><List.Item.Meta title={`${item.voucherNumber} - ${item.voucherType}`} description={`${item.ledger?.name || '-'} • ${formatDateTime(item.date)}`} /><CurrencyText value={item.amount} /></List.Item>} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="page-card" title="Recent Invoices">
            {loading ? <Skeleton /> : <List dataSource={data?.recentInvoices || []} renderItem={(item) => <List.Item><List.Item.Meta title={item.invoiceNumber} description={`${item.patient?.name || '-'} • ${item.status}`} /><CurrencyText value={item.total} /></List.Item>} />}
          </Card>
        </Col>
        <Col xs={24}>
          <Card className="page-card" title="Bed Occupancy Overview">
            <Typography.Text>Available: {data?.bedSummary?.Available || 0} | Occupied: {data?.bedSummary?.Occupied || 0} | Maintenance: {data?.bedSummary?.Maintenance || 0}</Typography.Text>
          </Card>
        </Col>
      </Row>
    </>
  );
}

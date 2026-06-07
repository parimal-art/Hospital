import React from 'react';
import { useMemo, useState } from 'react';
import { Layout, Menu, Button, Grid } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiActivity, FiArchive, FiBell, FiBookOpen, FiBriefcase, FiClipboard, FiCreditCard, FiFileText, FiGrid, FiHome, FiMenu, FiPackage, FiSettings, FiUsers } from 'react-icons/fi';
import NotificationDropdown from './NotificationDropdown.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/roles.js';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const menuMap = {
  [ROLES.ADMIN]: [
    ['/', 'Dashboard', <FiHome />], ['/employees', 'Employees', <FiUsers />], ['/patients', 'Patients', <FiActivity />], ['/admissions', 'IPD Admissions', <FiClipboard />], ['/beds', 'Beds', <FiArchive />], ['/billing', 'Billing', <FiFileText />], ['/medical-store', 'Medical Store', <FiPackage />], ['/ledgers', 'Ledgers', <FiBookOpen />], ['/transactions', 'Transactions', <FiCreditCard />], ['/doctors', 'Doctors', <FiBriefcase />], ['/documents', 'Documents', <FiFileText />], ['/reports', 'Reports', <FiGrid />], ['/notifications', 'Notifications', <FiBell />], ['/audit-logs', 'Audit Logs', <FiClipboard />], ['/settings', 'Settings', <FiSettings />]
  ],
  [ROLES.ACCOUNTS]: [
    ['/', 'Dashboard', <FiHome />], ['/billing', 'Billing', <FiFileText />], ['/medical-store', 'Medical Store', <FiPackage />], ['/transactions', 'Payments/Receipts', <FiCreditCard />], ['/ledgers', 'Ledgers', <FiBookOpen />], ['/patients', 'Patients', <FiActivity />], ['/reports', 'Reports', <FiGrid />], ['/my-profile', 'My Profile', <FiUsers />]
  ],
  [ROLES.RECEPTION]: [
    ['/', 'Dashboard', <FiHome />], ['/patients', 'Patients', <FiActivity />], ['/admissions', 'IPD Admissions', <FiClipboard />], ['/beds', 'Beds', <FiArchive />], ['/documents', 'Documents', <FiFileText />], ['/my-profile', 'My Profile', <FiUsers />]
  ],
  [ROLES.DOCTOR]: [
    ['/', 'Dashboard', <FiHome />], ['/admissions', 'My Patients', <FiActivity />], ['/documents', 'Patient Notes', <FiFileText />], ['/doctors', 'My Wage/Commission', <FiBriefcase />], ['/my-profile', 'My Profile', <FiUsers />]
  ],
  [ROLES.NURSE]: [
    ['/', 'Dashboard', <FiHome />], ['/admissions', 'Current IPD Patients', <FiActivity />], ['/daily-ipd', 'Daily IPD Entries', <FiClipboard />], ['/documents', 'Documents/IPD Notes', <FiFileText />], ['/my-profile', 'My Profile', <FiUsers />]
  ],
  [ROLES.MEDICAL_STORE]: [
    ['/', 'Dashboard', <FiHome />], ['/medical-store', 'Medical Store', <FiPackage />], ['/my-profile', 'My Profile', <FiUsers />]
  ],
  [ROLES.AUDITOR]: [
    ['/', 'Dashboard', <FiHome />], ['/reports', 'Reports', <FiGrid />], ['/ledgers', 'Ledgers', <FiBookOpen />], ['/transactions', 'Transactions', <FiCreditCard />], ['/patients', 'Patients', <FiActivity />], ['/medical-store', 'Medical Store', <FiPackage />], ['/audit-logs', 'Audit Logs', <FiClipboard />], ['/my-profile', 'My Profile', <FiUsers />]
  ]
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { user } = useAuth();
  const selectedKey = location.pathname.startsWith('/medical-store') ? '/medical-store' : location.pathname;
  const items = useMemo(() => (menuMap[user?.role] || menuMap[ROLES.RECEPTION]).map(([key, label, icon]) => ({ key, label, icon })), [user]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg" collapsedWidth={screens.md ? 80 : 0}>
        <div className="app-logo"><FiActivity /> {!collapsed && <span>TRINETRA</span>}</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={items} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 12px rgba(15,83,150,.06)' }}>
          <Button icon={<FiMenu />} onClick={() => setCollapsed(!collapsed)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}><NotificationDropdown /><ProfileDropdown /></div>
        </Header>
        <Content className="app-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}

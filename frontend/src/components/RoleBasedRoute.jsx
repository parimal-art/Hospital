import { Result } from 'antd';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleBasedRoute({ roles = [] }) {
  const { user } = useAuth();
  if (roles.length && !roles.includes(user?.role)) return <Result status="403" title="403" subTitle="You do not have permission to view this page." />;
  return <Outlet />;
}

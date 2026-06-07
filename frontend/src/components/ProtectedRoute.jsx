import { Navigate, Outlet } from 'react-router-dom';
import React from 'react';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spin size="large" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

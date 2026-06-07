import { BrowserRouter } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { AuthProvider } from './context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import React from 'react';

export default function App() {
  return (
    <AntApp>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </AntApp>
  );
}

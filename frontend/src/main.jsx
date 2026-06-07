import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0B5ED7',
          borderRadius: 12,
          colorBgLayout: '#F6FAFF',
          fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif'
        },
        components: {
          Layout: { siderBg: '#0A3D78', triggerBg: '#0A3D78' },
          Menu: { darkItemBg: '#0A3D78', darkSubMenuItemBg: '#07305f' },
          Card: { boxShadowTertiary: '0 8px 24px rgba(15, 83, 150, .08)' }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);

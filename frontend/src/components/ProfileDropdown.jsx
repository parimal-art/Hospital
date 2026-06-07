import { Avatar, Dropdown, Space } from 'antd';
import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = [
    { key: 'profile', label: 'My Profile', onClick: () => navigate('/my-profile') },
    { key: 'password', label: 'Change Password', onClick: () => navigate('/change-password') },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', onClick: () => { logout(); navigate('/login'); } }
  ];
  return <Dropdown menu={{ items }}><Space style={{ cursor: 'pointer' }}><Avatar icon={<UserOutlined />} /> <span className="hide-mobile">{user?.name}</span></Space></Dropdown>;
}

import { Button, Card, Form, Input, Typography } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { passwordRules } from '../../utils/validators.js';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const onFinish = async (values) => {
    await api.post('/auth/change-password', values);
    logout();
    navigate('/login');
  };
  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <Card className="page-card">
        <Typography.Title level={3}>Change Password</Typography.Title>
        <Typography.Paragraph type="secondary">New password must be strong. After change, login again with the new password.</Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true }]}><Input.Password /></Form.Item>
          <Form.Item name="newPassword" label="New Password" rules={passwordRules}><Input.Password /></Form.Item>
          <Form.Item name="confirmPassword" label="Confirm Password" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Passwords do not match.')); } })]}><Input.Password /></Form.Item>
          <Button type="primary" htmlType="submit">Change Password</Button>
        </Form>
      </Card>
    </div>
  );
}

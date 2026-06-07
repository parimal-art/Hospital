import { Button, Card, Form, Input, Typography } from 'antd';
import React from 'react';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const onFinish = async (values) => {
    const result = await login(values);
    navigate(result.mustChangePassword ? '/change-password' : '/');
  };
  return (
    <div className="login-shell">
      <Card className="login-card">
        <div className="brand-mark">C</div>
        <Typography.Title level={3}>Clinic IPD & Accounts</Typography.Title>
        <Typography.Paragraph type="secondary">Secure login for clinic ERP operations.</Typography.Paragraph>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ email: 'admin@clinic.com', password: 'Admin@123' }}>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input prefix={<MailOutlined />} placeholder="admin@clinic.com" /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}><Input.Password prefix={<LockOutlined />} placeholder="Password" /></Form.Item>
          <Button type="primary" htmlType="submit" block size="large">Login</Button>
          <div style={{ marginTop: 14, textAlign: 'right' }}><Link to="/forgot-password">Forgot Password?</Link></div>
        </Form>
      </Card>
    </div>
  );
}

import { Button, Card, Form, Input, Typography } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance.js';

export default function ForgotPassword() {
  const onFinish = async (values) => { await api.post('/auth/forgot-password', values); };
  return <div className="login-shell"><Card className="login-card"><Typography.Title level={3}>Forgot Password</Typography.Title><Typography.Paragraph type="secondary">Enter your registered email. If it exists, a reset link will be sent.</Typography.Paragraph><Form layout="vertical" onFinish={onFinish}><Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input /></Form.Item><Button type="primary" htmlType="submit" block>Send Reset Link</Button><div style={{ marginTop: 14 }}><Link to="/login">Back to Login</Link></div></Form></Card></div>;
}

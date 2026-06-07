import { Button, Card, Form, Input, Typography } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import { passwordRules } from '../../utils/validators.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const onFinish = async (values) => { await api.post(`/auth/reset-password/${token}`, values); navigate('/login'); };
  return <div className="login-shell"><Card className="login-card"><Typography.Title level={3}>Reset Password</Typography.Title><Form layout="vertical" onFinish={onFinish}><Form.Item name="newPassword" label="New Password" rules={passwordRules}><Input.Password /></Form.Item><Form.Item name="confirmPassword" label="Confirm Password" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error('Passwords do not match.')); } })]}><Input.Password /></Form.Item><Button type="primary" htmlType="submit" block>Reset Password</Button></Form></Card></div>;
}

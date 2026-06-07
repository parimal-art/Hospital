import { Button, Card, Descriptions, Form, Input, Progress, Upload } from 'antd';
import React from 'react';
import { useState } from 'react';
import api from '../../api/axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatusTag from '../../components/StatusTag.jsx';

export default function MyProfile() {
  const { user, fetchMe } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const save = async (values) => { setSaving(true); try { await api.put(`/employees/${user._id}`, values); await fetchMe(); } finally { setSaving(false); } };
  const uploadDocs = async (values) => {
    const fd = new FormData();
    ['profilePhoto','aadhaarCard','qualificationDocument','experienceDocument'].forEach(k => { const f = values[k]?.fileList?.[0]?.originFileObj; if (f) fd.append(k, f); });
    await api.post(`/employees/${user._id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    await fetchMe();
  };
  return <><PageHeader title="My Profile" subtitle="Update your profile and upload required documents." />{user && <Card className="page-card"><Descriptions bordered column={{ xs: 1, md: 2 }}><Descriptions.Item label="Name">{user.name}</Descriptions.Item><Descriptions.Item label="Email">{user.email}</Descriptions.Item><Descriptions.Item label="Role">{user.role}</Descriptions.Item><Descriptions.Item label="Verification"><StatusTag value={user.verificationStatus} /></Descriptions.Item></Descriptions><div style={{ margin: '18px 0' }}><Progress percent={user.profileCompletionPercentage || 0} /></div><Form layout="vertical" form={form} initialValues={user} onFinish={save}><Form.Item name="phone" label="Phone"><Input /></Form.Item><Form.Item name="address" label="Address"><Input.TextArea rows={3} /></Form.Item><Form.Item name="emergencyContactNumber" label="Emergency Contact"><Input /></Form.Item><Button type="primary" htmlType="submit" loading={saving}>Save Profile</Button></Form><Card style={{ marginTop: 18 }} title="Upload Documents"><Form layout="vertical" onFinish={uploadDocs}><Form.Item name="profilePhoto" label="Profile Photo"><Upload beforeUpload={() => false} maxCount={1}><Button>Select</Button></Upload></Form.Item><Form.Item name="aadhaarCard" label="Aadhaar/ID Proof"><Upload beforeUpload={() => false} maxCount={1}><Button>Select</Button></Upload></Form.Item><Form.Item name="qualificationDocument" label="Qualification Document"><Upload beforeUpload={() => false} maxCount={1}><Button>Select</Button></Upload></Form.Item><Button type="primary" htmlType="submit">Upload for Verification</Button></Form></Card></Card>}</>;
}

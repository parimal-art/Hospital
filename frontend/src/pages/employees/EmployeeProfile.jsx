import { Card, Descriptions, Progress, Tabs, Tag, Upload, Button, Form, Input, Select } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import { formatDate } from '../../utils/formatDate.js';

export default function EmployeeProfile() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [form] = Form.useForm();
  const load = async () => { const { data } = await api.get(`/employees/${id}`); setItem(data.data); };
  useEffect(() => { load(); }, [id]);
  const verify = async (values) => { await api.patch(`/employees/${id}/verify`, values); load(); };
  return <><PageHeader title="Employee Profile" subtitle="Profile completion, uploaded documents and verification." />{item && <Card className="page-card"><Tabs items={[{ key: 'details', label: 'Details', children: <><Descriptions bordered column={{ xs: 1, md: 2 }}><Descriptions.Item label="Name">{item.name}</Descriptions.Item><Descriptions.Item label="Email">{item.email}</Descriptions.Item><Descriptions.Item label="Role">{item.role}</Descriptions.Item><Descriptions.Item label="Department">{item.department}</Descriptions.Item><Descriptions.Item label="Status"><StatusTag value={item.isActive ? 'Active' : 'Inactive'} /></Descriptions.Item><Descriptions.Item label="Verification"><StatusTag value={item.verificationStatus} /></Descriptions.Item><Descriptions.Item label="Joining">{formatDate(item.joiningDate)}</Descriptions.Item><Descriptions.Item label="Shift">{item.shiftStart || '-'} to {item.shiftEnd || '-'}</Descriptions.Item><Descriptions.Item label="Address" span={2}>{item.address || '-'}</Descriptions.Item></Descriptions><div style={{ marginTop: 18 }}><Progress percent={item.profileCompletionPercentage || 0} /><div>{(item.pendingRequiredFields || []).map(f => <Tag key={f}>{f}</Tag>)}</div></div></> }, { key: 'docs', label: 'Documents', children: <div><p>Profile photo: {item.profilePhoto || '-'}</p><p>Aadhaar/ID: {item.aadhaarCard || '-'}</p><p>Qualification: {item.qualificationDocument || '-'}</p><Upload beforeUpload={() => false}><Button>Choose document</Button></Upload></div> }, { key: 'verify', label: 'Verification', children: <Form form={form} layout="vertical" onFinish={verify}><Form.Item name="verificationStatus" label="Verification Status" rules={[{ required: true }]}><Select options={['Document Pending','Verification Pending','Verified','Rejected'].map(v => ({ label: v, value: v }))} /></Form.Item><Form.Item name="verificationRemark" label="Remark"><Input.TextArea rows={4} /></Form.Item><Button type="primary" htmlType="submit">Update Verification</Button></Form> }]} /></Card>}</>;
}

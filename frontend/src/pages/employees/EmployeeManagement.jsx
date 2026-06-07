import { Button, Form, Input, DatePicker, Select, Space, Switch, Progress } from 'antd';
import React from 'react';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import dayjs from 'dayjs';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import useCrud from '../common/useCrud.js';
import { roleOptions } from '../../utils/roles.js';
import { formatDate } from '../../utils/formatDate.js';

export default function EmployeeManagement() {
  const crud = useCrud('/employees');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const startCreate = () => { setEditing(null); form.resetFields(); setOpen(true); };
  const startEdit = (r) => { setEditing(r); form.setFieldsValue({ ...r, joiningDate: r.joiningDate ? dayjs(r.joiningDate) : undefined }); setOpen(true); };
  const save = async (values) => {
    const payload = { ...values, joiningDate: values.joiningDate?.toISOString?.(), isActive: values.isActive ?? true };
    if (editing) await crud.update(editing._id, payload); else await crud.create(payload);
    setOpen(false);
  };
  const columns = [
    { title: 'Name', dataIndex: 'name', sorter: (a,b) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Role', dataIndex: 'role', filters: roleOptions.map(o => ({ text: o.label, value: o.value })), onFilter: (v,r) => r.role === v },
    { title: 'Department', dataIndex: 'department' },
    { title: 'Profile', dataIndex: 'profileCompletionPercentage', render: (v) => <Progress percent={v || 0} size="small" /> },
    { title: 'Verification', dataIndex: 'verificationStatus', render: (v) => <StatusTag value={v} /> },
    { title: 'Status', dataIndex: 'isActive', render: (v) => <StatusTag value={v ? 'Active' : 'Inactive'} /> },
    { title: 'Joining', dataIndex: 'joiningDate', render: formatDate },
    { title: 'Action', fixed: 'right', render: (_, r) => <Space><Button type="link" onClick={() => startEdit(r)}>Edit</Button><ConfirmAction title="Change employee status?" onConfirm={() => api.patch(`/employees/${r._id}/status`, { isActive: !r.isActive }).then(crud.load)}>{r.isActive ? 'Deactivate' : 'Activate'}</ConfirmAction><Button type="link" href={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}/api/employees/${r._id}/profile-pdf`} target="_blank">PDF</Button></Space> }
  ];
  return <><PageHeader title="Employee Management" subtitle="Create employees, manage roles, status and verification." extra={<Button type="primary" icon={<FiPlus />} onClick={startCreate}>Create Employee</Button>} /><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load} /><DataTable columns={columns} data={crud.rows} loading={crud.loading} /><FormDrawer title={editing ? 'Edit Employee' : 'Create Employee'} open={open} onClose={() => setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input disabled={!!editing} /></Form.Item>{!editing && <Form.Item name="defaultPassword" label="Default Password" rules={[{ required: true }]}><Input.Password /></Form.Item>}<Form.Item name="phone" label="Phone"><Input /></Form.Item><Form.Item name="role" label="Role" rules={[{ required: true }]}><Select options={roleOptions} /></Form.Item><Form.Item name="department" label="Department"><Input /></Form.Item><Form.Item name="joiningDate" label="Joining Date"><DatePicker style={{ width: '100%' }} /></Form.Item><Form.Item name="shiftStart" label="Shift Start"><Input placeholder="09:00" /></Form.Item><Form.Item name="shiftEnd" label="Shift End"><Input placeholder="19:00" /></Form.Item><Form.Item name="isActive" label="Active" valuePropName="checked"><Switch defaultChecked /></Form.Item></FormDrawer></>;
}

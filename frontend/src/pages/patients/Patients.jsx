import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import useCrud from '../common/useCrud.js';
import { formatDate } from '../../utils/formatDate.js';

export default function Patients(){
 const crud=useCrud('/patients'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm(); const navigate=useNavigate();
 const start=(r=null)=>{setEditing(r); form.resetFields(); if(r) form.setFieldsValue({...r,dateOfBirth:r.dateOfBirth?dayjs(r.dateOfBirth):undefined}); setOpen(true)};
 const save=async(v)=>{const payload={...v,dateOfBirth:v.dateOfBirth?.toISOString?.()}; editing? await crud.update(editing._id,payload): await crud.create(payload); setOpen(false)};
 const columns=[{title:'Reg. No',dataIndex:'registrationNumber'},{title:'Name',dataIndex:'name',sorter:(a,b)=>a.name.localeCompare(b.name)},{title:'Guardian',dataIndex:'guardianName'},{title:'Gender',dataIndex:'gender'},{title:'Age',dataIndex:'age'},{title:'Mobile',dataIndex:'mobile'},{title:'Type',dataIndex:'patientType'},{title:'Registered',dataIndex:'registrationDate',render:formatDate},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>navigate(`/patients/${r._id}`)}>View</Button><Button type="link" onClick={()=>start(r)}>Edit</Button></Space>}];
 return <><PageHeader title="Patients" subtitle="Register patients and track patient-wise billing, documents and IPD history." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Register Patient</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Patient':'Register Patient'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="name" label="Patient Name" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="guardianName" label="Guardian/Father/Husband Name"><Input/></Form.Item><Form.Item name="gender" label="Gender"><Select options={['Male','Female','Other'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="age" label="Age"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="dateOfBirth" label="Date of Birth"><DatePicker style={{width:'100%'}}/></Form.Item><Form.Item name="mobile" label="Mobile"><Input/></Form.Item><Form.Item name="emergencyContact" label="Emergency Contact"><Input/></Form.Item><Form.Item name="patientType" label="Patient Type"><Select options={['OPD','IPD'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="address" label="Address"><Input.TextArea rows={3}/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item></FormDrawer></>;
}

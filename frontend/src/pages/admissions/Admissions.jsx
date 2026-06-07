import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import useCrud from '../common/useCrud.js';
import { formatDateTime } from '../../utils/formatDate.js';

export default function Admissions(){
 const crud=useCrud('/admissions'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm(); const [patients,setPatients]=useState([]); const [beds,setBeds]=useState([]); const [doctors,setDoctors]=useState([]); const navigate=useNavigate();
 useEffect(()=>{api.get('/patients').then(r=>setPatients(r.data.data)); api.get('/beds').then(r=>setBeds(r.data.data)); api.get('/doctors').then(r=>setDoctors(r.data.data));},[]);
 const start=(r=null)=>{setEditing(r); form.resetFields(); if(r) form.setFieldsValue({...r, patient:r.patient?._id, bed:r.bed?._id, assignedDoctor:r.assignedDoctor?._id, admissionDateTime:r.admissionDateTime?dayjs(r.admissionDateTime):undefined}); setOpen(true)};
 const save=async(v)=>{const payload={...v,admissionDateTime:v.admissionDateTime?.toISOString?.()}; editing? await crud.update(editing._id,payload): await crud.create(payload); setOpen(false)};
 const columns=[{title:'Admission No',dataIndex:'admissionNumber'},{title:'Patient',render:(_,r)=>r.patient?.name},{title:'Bed',render:(_,r)=>r.bed?.bedNumber},{title:'Doctor',render:(_,r)=>r.assignedDoctor?.name},{title:'Date',dataIndex:'admissionDateTime',render:formatDateTime},{title:'Deposit',dataIndex:'initialDeposit',render:v=><CurrencyText value={v}/>},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>navigate(`/admissions/${r._id}`)}>View</Button><Button type="link" onClick={()=>start(r)}>Edit</Button>{!['Discharged','Cancelled'].includes(r.status)&&<ConfirmAction onConfirm={()=>api.patch(`/admissions/${r._id}/discharge-request`).then(crud.load)}>Request Discharge</ConfirmAction>}</Space>}];
 return <><PageHeader title="IPD Admissions" subtitle="Create admission, assign bed and doctor, track admission-to-discharge workflow." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Create Admission</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Admission':'Create IPD Admission'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="patient" label="Patient" rules={[{required:true}]}><Select showSearch options={patients.map(p=>({label:`${p.name} (${p.registrationNumber})`,value:p._id}))}/></Form.Item><Form.Item name="bed" label="Available Bed" rules={[{required:true}]}><Select showSearch options={beds.filter(b=>editing||b.status==='Available').map(b=>({label:`${b.bedNumber} - ${b.wardName} (${b.status})`,value:b._id}))}/></Form.Item><Form.Item name="assignedDoctor" label="Assigned Doctor" rules={[{required:true}]}><Select showSearch options={doctors.map(d=>({label:d.name,value:d._id}))}/></Form.Item><Form.Item name="admissionDateTime" label="Admission Date/Time"><DatePicker showTime style={{width:'100%'}}/></Form.Item><Form.Item name="admissionReason" label="Admission Reason"><Input.TextArea rows={2}/></Form.Item><Form.Item name="diagnosis" label="Diagnosis"><Input.TextArea rows={2}/></Form.Item>{!editing&&<Form.Item name="initialDeposit" label="Initial Deposit"><InputNumber min={0} style={{width:'100%'}}/></Form.Item>}<Form.Item name="paymentMode" label="Deposit Payment Mode"><Select options={['Cash','Bank','UPI','Card','Cheque','Other'].map(v=>({label:v,value:v}))}/></Form.Item></FormDrawer></>;
}

import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import useCrud from '../common/useCrud.js';

export default function Doctors(){
 const crud=useCrud('/doctors'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm(); const navigate=useNavigate();
 const start=(r=null)=>{setEditing(r); form.resetFields(); if(r) form.setFieldsValue(r); setOpen(true)}; const save=async(v)=>{editing?await crud.update(editing._id,v):await crud.create(v); setOpen(false)};
 const columns=[{title:'Doctor',dataIndex:'name'},{title:'Specialization',dataIndex:'specialization'},{title:'Phone',dataIndex:'phone'},{title:'Wage Type',dataIndex:'wageType'},{title:'Wage Value',dataIndex:'wageAmount',render:v=><CurrencyText value={v}/>},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>navigate(`/doctors/${r._id}`)}>View</Button><Button type="link" onClick={()=>start(r)}>Edit</Button></Space>}];
 return <><PageHeader title="Doctors" subtitle="Doctor profile, patient assignment and wage/commission configuration." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Create Doctor</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Doctor':'Create Doctor'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form}><Form.Item name="name" label="Doctor Name" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="specialization" label="Specialization"><Input/></Form.Item><Form.Item name="phone" label="Phone"><Input/></Form.Item><Form.Item name="email" label="Email"><Input/></Form.Item><Form.Item name="wageType" label="Wage Type"><Select options={['Per Day','Per Round','Per Patient','Per Hour','Commission Percentage','Fixed'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="wageAmount" label="Wage Amount / Percentage"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="status" label="Status"><Select options={['Active','Inactive'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item></FormDrawer></>;
}

import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import useCrud from '../common/useCrud.js';

export default function Beds(){
 const crud=useCrud('/beds'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm();
 const start=(r=null)=>{setEditing(r); form.resetFields(); if(r) form.setFieldsValue(r); setOpen(true)}; const save=async(v)=>{editing?await crud.update(editing._id,v):await crud.create(v); setOpen(false)};
 const columns=[{title:'Bed No',dataIndex:'bedNumber'},{title:'Ward',dataIndex:'wardName'},{title:'Type',dataIndex:'bedType'},{title:'Rent/Day',dataIndex:'dailyBedRent',render:v=><CurrencyText value={v}/>},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Current Patient',render:(_,r)=>r.currentPatient?.name||'-'},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>start(r)}>Edit</Button><Select value={r.status} style={{width:130}} onChange={(status)=>api.patch(`/beds/${r._id}/status`,{status}).then(crud.load)} options={['Available','Occupied','Maintenance'].map(v=>({label:v,value:v}))}/></Space>}];
 return <><PageHeader title="Beds" subtitle="Manage ward beds, daily rent and occupancy." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Create Bed</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Bed':'Create Bed'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="bedNumber" label="Bed Number" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="wardName" label="Ward Name" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="bedType" label="Bed Type"><Select options={['General','Private','ICU','Semi-private','Other'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="dailyBedRent" label="Daily Bed Rent" rules={[{required:true}]}><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="status" label="Status"><Select options={['Available','Occupied','Maintenance'].map(v=>({label:v,value:v}))}/></Form.Item></FormDrawer></>;
}

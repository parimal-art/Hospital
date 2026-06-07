import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { FiPlus } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import useCrud from '../common/useCrud.js';
import { formatDate } from '../../utils/formatDate.js';

export default function Transactions(){
 const crud=useCrud('/transactions'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm(); const [ledgers,setLedgers]=useState([]); const [patients,setPatients]=useState([]); const [doctors,setDoctors]=useState([]);
 useEffect(()=>{api.get('/ledgers').then(r=>setLedgers(r.data.data)); api.get('/patients').then(r=>setPatients(r.data.data)); api.get('/doctors').then(r=>setDoctors(r.data.data));},[]);
 const start=(r=null)=>{setEditing(r); form.resetFields(); if(r) form.setFieldsValue({...r, ledger:r.ledger?._id||r.ledger, patient:r.patient?._id, doctor:r.doctor?._id, date:r.date?dayjs(r.date):undefined}); setOpen(true)};
 const save=async(v)=>{const payload={...v,date:v.date?.toISOString?.()}; editing? await crud.update(editing._id,payload): await crud.create(payload); setOpen(false)};
 const columns=[{title:'Voucher',dataIndex:'voucherNumber'},{title:'Date',dataIndex:'date',render:formatDate},{title:'Type',dataIndex:'voucherType'},{title:'Ledger',render:(_,r)=>r.ledger?.name},{title:'Patient',render:(_,r)=>r.patient?.name||'-'},{title:'Mode',dataIndex:'paymentMode'},{title:'Amount',dataIndex:'amount',render:v=><CurrencyText value={v}/>},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>start(r)}>Edit</Button>{r.status!=='Cancelled'&&<ConfirmAction onConfirm={()=>api.patch(`/transactions/${r._id}/cancel`,{cancelReason:'Cancelled'}).then(crud.load)}>Cancel</ConfirmAction>}</Space>}];
 return <><PageHeader title="Transactions / Vouchers" subtitle="Receipt, payment, journal and adjustment entries with ledger names." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Create Voucher</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Voucher':'Create Voucher'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="date" label="Date"><DatePicker style={{width:'100%'}}/></Form.Item><Form.Item name="voucherType" label="Voucher Type" rules={[{required:true}]}><Select options={['Payment','Receipt','Journal','Adjustment'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="ledger" label="Ledger" rules={[{required:true}]}><Select showSearch options={ledgers.map(l=>({label:l.name,value:l._id}))}/></Form.Item><Form.Item name="patient" label="Patient"><Select allowClear showSearch options={patients.map(p=>({label:`${p.name} (${p.registrationNumber})`,value:p._id}))}/></Form.Item><Form.Item name="doctor" label="Doctor"><Select allowClear showSearch options={doctors.map(d=>({label:d.name,value:d._id}))}/></Form.Item><Form.Item name="amount" label="Amount" rules={[{required:true}]}><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="paymentMode" label="Payment Mode"><Select options={['Cash','Bank','UPI','Card','Cheque','Other'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="description" label="Description"><Input.TextArea rows={3}/></Form.Item></FormDrawer></>;
}

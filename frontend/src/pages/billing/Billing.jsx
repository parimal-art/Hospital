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
import { formatDate } from '../../utils/formatDate.js';

export default function Billing(){
 const crud=useCrud('/invoices'); const [open,setOpen]=useState(false); const [form]=Form.useForm(); const [patients,setPatients]=useState([]); const [admissions,setAdmissions]=useState([]); const [ledgers,setLedgers]=useState([]); const navigate=useNavigate();
 useEffect(()=>{api.get('/patients').then(r=>setPatients(r.data.data)); api.get('/admissions').then(r=>setAdmissions(r.data.data)); api.get('/ledgers').then(r=>setLedgers(r.data.data));},[]);
 const save=async(v)=>{const items=[{serviceName:v.serviceName,quantity:v.quantity||1,rate:v.rate||0,discount:v.itemDiscount||0,tax:v.itemTax||0}]; await api.post('/invoices',{...v,date:v.date?.toISOString?.(),items}); setOpen(false); crud.load();};
 const columns=[{title:'Invoice No',dataIndex:'invoiceNumber'},{title:'Type',dataIndex:'invoiceType'},{title:'Patient',render:(_,r)=>r.patient?.name||'-'},{title:'Date',dataIndex:'date',render:formatDate},{title:'Total',dataIndex:'total',render:v=><CurrencyText value={v}/>},{title:'Paid',dataIndex:'paidAmount',render:v=><CurrencyText value={v}/>},{title:'Balance',dataIndex:'balanceAmount',render:v=><CurrencyText value={v}/>},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>navigate(`/billing/${r._id}`)}>View</Button>{r.status!=='Cancelled'&&<ConfirmAction onConfirm={()=>api.patch(`/invoices/${r._id}/cancel`,{cancelReason:'Cancelled'}).then(crud.load)}>Cancel</ConfirmAction>}</Space>}];
 return <><PageHeader title="Billing & Invoices" subtitle="Normal invoices, medicine sale invoices, receipts, payment status and discharge final bills." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>{form.resetFields();setOpen(true)}}>Create Invoice</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title="Create Invoice" open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form}><Form.Item name="invoiceType" label="Invoice Type" initialValue="Normal"><Select options={['Normal','Discharge Final','Medicine Sale'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="patient" label="Patient"><Select allowClear showSearch options={patients.map(p=>({label:`${p.name} (${p.registrationNumber})`,value:p._id}))}/></Form.Item><Form.Item name="admission" label="Admission"><Select allowClear showSearch options={admissions.map(a=>({label:`${a.admissionNumber} - ${a.patient?.name}`,value:a._id}))}/></Form.Item><Form.Item name="ledger" label="Ledger"><Select allowClear showSearch options={ledgers.map(l=>({label:l.name,value:l._id}))}/></Form.Item><Form.Item name="date" label="Date" initialValue={dayjs()}><DatePicker style={{width:'100%'}}/></Form.Item><Form.Item name="serviceName" label="Service/Item" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="quantity" label="Quantity" initialValue={1}><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="rate" label="Rate" rules={[{required:true}]}><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="discount" label="Invoice Discount"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="tax" label="Invoice Tax"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="paidAmount" label="Paid Amount"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="paymentMode" label="Payment Mode"><Select options={['Cash','Bank','UPI','Card','Cheque','Other'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item></FormDrawer></>;
}

import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import React from 'react';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import ConfirmAction from '../../components/ConfirmAction.jsx';
import useCrud from '../common/useCrud.js';

const groups = ['Cash','Bank','Patient Receivable','Income','Expense','Doctor Payable','Supplier','Asset','Liability','Other'].map(v => ({ label: v, value: v }));
export default function Ledgers() {
  const crud = useCrud('/ledgers'); const [open,setOpen]=useState(false); const [editing,setEditing]=useState(null); const [form]=Form.useForm();
  const save = async (v) => { editing ? await crud.update(editing._id,v) : await crud.create(v); setOpen(false); };
  const start = (r=null) => { setEditing(r); form.resetFields(); if(r) form.setFieldsValue(r); setOpen(true); };
  const columns=[{title:'Ledger Name',dataIndex:'name',sorter:(a,b)=>a.name.localeCompare(b.name)},{title:'Group',dataIndex:'group'},{title:'Opening',dataIndex:'openingBalance',render:v=><CurrencyText value={v}/>},{title:'Type',dataIndex:'balanceType'},{title:'Status',dataIndex:'status',render:v=><StatusTag value={v}/>},{title:'Action',fixed:'right',render:(_,r)=><Space><Button type="link" onClick={()=>start(r)}>Edit</Button><ConfirmAction danger onConfirm={()=>crud.remove(r._id)}>Delete</ConfirmAction></Space>}];
  return <><PageHeader title="Ledgers" subtitle="Tally-style account heads for cash, bank, income, expense and payable tracking." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>start()}>Create Ledger</Button>} /><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title={editing?'Edit Ledger':'Create Ledger'} open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form} loading={crud.saving}><Form.Item name="name" label="Ledger Name" rules={[{required:true}]}><Input/></Form.Item><Form.Item name="group" label="Ledger Group" rules={[{required:true}]}><Select options={groups}/></Form.Item><Form.Item name="openingBalance" label="Opening Balance"><InputNumber min={0} style={{width:'100%'}}/></Form.Item><Form.Item name="balanceType" label="Balance Type"><Select options={['Debit','Credit'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="status" label="Status"><Select options={['Active','Inactive'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item></FormDrawer></>;
}

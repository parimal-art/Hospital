import { Button, DatePicker, Form, Input, InputNumber, Select, Space, Upload } from 'antd';
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
import useCrud from '../common/useCrud.js';
import { formatDate } from '../../utils/formatDate.js';

export default function DailyIpdEntries(){
 const crud=useCrud('/daily-ipd'); const [open,setOpen]=useState(false); const [form]=Form.useForm(); const [admissions,setAdmissions]=useState([]);
 useEffect(()=>{api.get('/admissions').then(r=>setAdmissions(r.data.data));},[]);
 const save=async(v)=>{const fd=new FormData(); Object.entries(v).forEach(([k,val])=>{ if(k==='attachments') (val?.fileList||[]).forEach(f=>fd.append('attachments',f.originFileObj)); else if(val!==undefined) fd.append(k, val?.toISOString?.()||val); }); await api.post('/daily-ipd',fd,{headers:{'Content-Type':'multipart/form-data'}}); setOpen(false); crud.load();};
 const columns=[{title:'Date',dataIndex:'date',render:formatDate},{title:'Admission',render:(_,r)=>r.admission?.admissionNumber},{title:'Patient',render:(_,r)=>r.patient?.name},{title:'Doctor',render:(_,r)=>r.doctor?.name},{title:'Bed Rent',dataIndex:'bedRent',render:v=><CurrencyText value={v}/>},{title:'Doctor Charge',dataIndex:'dailyDoctorVisitCharge',render:v=><CurrencyText value={v}/>},{title:'Medicine',dataIndex:'medicineCharge',render:v=><CurrencyText value={v}/>},{title:'Notes',dataIndex:'notes'}];
 return <><PageHeader title="Daily IPD Entries" subtitle="Bed rent, nursing, medicine, lab and service charges with notes and attachments." extra={<Button type="primary" icon={<FiPlus/>} onClick={()=>{form.resetFields();setOpen(true)}}>Add Daily Entry</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title="Add Daily IPD Entry" open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form}><Form.Item name="admission" label="Admission" rules={[{required:true}]}><Select showSearch options={admissions.filter(a=>a.status!=='Discharged').map(a=>({label:`${a.admissionNumber} - ${a.patient?.name}`,value:a._id}))}/></Form.Item><Form.Item name="date" label="Date" initialValue={dayjs()}><DatePicker style={{width:'100%'}}/></Form.Item>{['bedRent','dailyDoctorVisitCharge','nursingCharge','medicineCharge','labTestCharge','otherServiceCharge','otherExpense'].map(k=><Form.Item key={k} name={k} label={k.replace(/([A-Z])/g,' $1')}><InputNumber min={0} style={{width:'100%'}}/></Form.Item>)}<Form.Item name="notes" label="Notes"><Input.TextArea rows={3}/></Form.Item><Form.Item name="attachments" label="Attachments"><Upload beforeUpload={()=>false} multiple><Button>Select Files</Button></Upload></Form.Item></FormDrawer></>;
}

import { Button, Form, Input, Select, Upload } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { FiUpload } from 'react-icons/fi';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import SearchFilterBar from '../../components/SearchFilterBar.jsx';
import FormDrawer from '../../components/FormDrawer.jsx';
import useCrud from '../common/useCrud.js';
import { formatDateTime } from '../../utils/formatDate.js';

export default function Documents(){
 const crud=useCrud('/documents'); const [open,setOpen]=useState(false); const [form]=Form.useForm(); const [patients,setPatients]=useState([]); const [admissions,setAdmissions]=useState([]);
 useEffect(()=>{api.get('/patients').then(r=>setPatients(r.data.data)); api.get('/admissions').then(r=>setAdmissions(r.data.data));},[]);
 const save=async(v)=>{const fd=new FormData(); fd.append('file',v.file.fileList[0].originFileObj); ['patient','admission','documentType','description'].forEach(k=>v[k]&&fd.append(k,v[k])); await api.post('/documents/upload',fd,{headers:{'Content-Type':'multipart/form-data'}}); setOpen(false); crud.load();};
 const columns=[{title:'Type',dataIndex:'documentType'},{title:'File',render:(_,r)=><a href={`${import.meta.env.VITE_STATIC_URL||'http://localhost:5000'}${r.fileUrl}`} target="_blank">{r.originalName||r.fileName}</a>},{title:'Patient',render:(_,r)=>r.patient?.name||'-'},{title:'Admission',render:(_,r)=>r.admission?.admissionNumber||'-'},{title:'Uploaded By',render:(_,r)=>r.uploadedBy?.name||'-'},{title:'Date',dataIndex:'createdAt',render:formatDateTime}];
 return <><PageHeader title="Documents / IPD Notes" subtitle="Scan/upload IPD notes, prescriptions, lab reports and billing files." extra={<Button type="primary" icon={<FiUpload/>} onClick={()=>{form.resetFields();setOpen(true)}}>Upload Document</Button>}/><SearchFilterBar search={crud.search} setSearch={crud.setSearch} onRefresh={crud.load}/><DataTable columns={columns} data={crud.rows} loading={crud.loading}/><FormDrawer title="Upload Document" open={open} onClose={()=>setOpen(false)} onSubmit={save} form={form}><Form.Item name="documentType" label="Document Type" rules={[{required:true}]}><Select options={['IPD Note','Prescription','Lab Report','Discharge Paper','Billing File','Other'].map(v=>({label:v,value:v}))}/></Form.Item><Form.Item name="patient" label="Patient"><Select allowClear showSearch options={patients.map(p=>({label:p.name,value:p._id}))}/></Form.Item><Form.Item name="admission" label="Admission"><Select allowClear showSearch options={admissions.map(a=>({label:a.admissionNumber,value:a._id}))}/></Form.Item><Form.Item name="description" label="Description"><Input.TextArea rows={3}/></Form.Item><Form.Item name="file" label="File" rules={[{required:true}]}><Upload beforeUpload={()=>false} maxCount={1}><Button>Select File</Button></Upload></Form.Item></FormDrawer></>;
}

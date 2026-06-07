import { Card, Descriptions, List, Tabs, Timeline } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function PatientDetails(){
 const {id}=useParams(); const [patient,setPatient]=useState(null); const [timeline,setTimeline]=useState({});
 useEffect(()=>{api.get(`/patients/${id}`).then(r=>setPatient(r.data.data)); api.get(`/patients/${id}/timeline`).then(r=>setTimeline(r.data.data));},[id]);
 return <><PageHeader title="Patient Details" subtitle="Patient timeline, billing, payments and uploaded documents."/>{patient&&<Card className="page-card"><Descriptions bordered column={{xs:1,md:2}}><Descriptions.Item label="Registration No">{patient.registrationNumber}</Descriptions.Item><Descriptions.Item label="Name">{patient.name}</Descriptions.Item><Descriptions.Item label="Mobile">{patient.mobile}</Descriptions.Item><Descriptions.Item label="Type">{patient.patientType}</Descriptions.Item><Descriptions.Item label="Address" span={2}>{patient.address}</Descriptions.Item></Descriptions><Tabs style={{marginTop:18}} items={[{key:'timeline',label:'Timeline',children:<Timeline items={[...(timeline.admissions||[]).map(a=>({children:`${a.admissionNumber} - ${a.status} - ${formatDateTime(a.admissionDateTime)}`})),...(timeline.invoices||[]).map(i=>({children:`Invoice ${i.invoiceNumber} - ${i.status}`})),...(timeline.transactions||[]).map(t=>({children:`${t.voucherType} ${t.voucherNumber} - ₹${t.amount}`}))]}/>},{key:'invoices',label:'Invoices',children:<List dataSource={timeline.invoices||[]} renderItem={i=><List.Item><List.Item.Meta title={i.invoiceNumber} description={i.status}/><CurrencyText value={i.total}/></List.Item>}/>},{key:'payments',label:'Payments',children:<List dataSource={timeline.transactions||[]} renderItem={t=><List.Item><List.Item.Meta title={t.voucherNumber} description={`${t.voucherType} • ${t.ledger?.name}`}/><CurrencyText value={t.amount}/></List.Item>}/>},{key:'docs',label:'Documents',children:<List dataSource={timeline.documents||[]} renderItem={d=><List.Item><List.Item.Meta title={d.originalName||d.fileName} description={d.documentType}/><a href={`${import.meta.env.VITE_STATIC_URL||'http://localhost:5000'}${d.fileUrl}`} target="_blank">Open</a></List.Item>}/>}]} /></Card>}</>;
}

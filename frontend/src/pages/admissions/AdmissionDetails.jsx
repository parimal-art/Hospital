import { Button, Card, Descriptions, Form, Input, Steps, Tabs, Timeline } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function AdmissionDetails(){
 const {id}=useParams(); const [data,setData]=useState(null); const load=async()=>{const r=await api.get(`/admissions/${id}`); setData(r.data.data)}; useEffect(()=>{load()},[id]);
 const discharge=async(v)=>{await api.patch(`/admissions/${id}/discharge`,v); load();};
 const a=data?.admission; const c=data?.charges||{}; const stepMap={'Admitted':0,'Under Treatment':1,'Discharge Requested':2,'Discharged':3,'Cancelled':0};
 return <><PageHeader title="Admission Details" subtitle="Running bill, patient status and discharge workflow." />{a&&<Card className="page-card"><Steps current={stepMap[a.status]||0} items={['Admitted','Under Treatment','Discharge Requested','Discharged'].map(title=>({title}))}/><Descriptions bordered column={{xs:1,md:2}} style={{marginTop:18}}><Descriptions.Item label="Admission No">{a.admissionNumber}</Descriptions.Item><Descriptions.Item label="Status"><StatusTag value={a.status}/></Descriptions.Item><Descriptions.Item label="Patient">{a.patient?.name}</Descriptions.Item><Descriptions.Item label="Doctor">{a.assignedDoctor?.name}</Descriptions.Item><Descriptions.Item label="Bed">{a.bed?.bedNumber}</Descriptions.Item><Descriptions.Item label="Admission Date">{formatDateTime(a.admissionDateTime)}</Descriptions.Item><Descriptions.Item label="Running Charges"><CurrencyText value={c.dailyTotal}/></Descriptions.Item><Descriptions.Item label="Deposits"><CurrencyText value={c.depositTotal}/></Descriptions.Item><Descriptions.Item label="Balance Due"><CurrencyText value={c.balanceDue}/></Descriptions.Item><Descriptions.Item label="Refund"><CurrencyText value={c.refundAmount}/></Descriptions.Item></Descriptions><Tabs style={{marginTop:18}} items={[{key:'entries',label:'Daily Entries',children:<Timeline items={(c.entries||[]).map(e=>({children:`${formatDateTime(e.date)} - Bed ₹${e.bedRent}, Medicine ₹${e.medicineCharge}, Notes: ${e.notes||'-'}`}))}/>},{key:'discharge',label:'Discharge',children:<Form layout="vertical" onFinish={discharge}><Form.Item name="dischargeSummary" label="Discharge Summary"><Input.TextArea rows={4}/></Form.Item><Button type="primary" htmlType="submit" disabled={a.status==='Discharged'}>Approve & Discharge</Button></Form>}]} /></Card>}</>;
}

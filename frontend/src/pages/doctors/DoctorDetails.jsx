import { Button, Card, DatePicker, Descriptions, List, Space } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';

export default function DoctorDetails(){
 const {id}=useParams(); const [doctor,setDoctor]=useState(null); const [patients,setPatients]=useState([]); const [wage,setWage]=useState(null);
 const load=async()=>{setDoctor((await api.get(`/doctors/${id}`)).data.data); setPatients((await api.get(`/doctors/${id}/patients`)).data.data); setWage((await api.get(`/doctors/${id}/wages`)).data.data);}; useEffect(()=>{load()},[id]);
 return <><PageHeader title="Doctor Details" subtitle="Assigned patients and wage/commission summary." />{doctor&&<Card className="page-card"><Descriptions bordered column={{xs:1,md:2}}><Descriptions.Item label="Name">{doctor.name}</Descriptions.Item><Descriptions.Item label="Specialization">{doctor.specialization}</Descriptions.Item><Descriptions.Item label="Wage Type">{doctor.wageType}</Descriptions.Item><Descriptions.Item label="Wage Value"><CurrencyText value={doctor.wageAmount}/></Descriptions.Item></Descriptions><Card style={{marginTop:18}} title="Current Assigned Patients"><List dataSource={patients} renderItem={a=><List.Item><List.Item.Meta title={a.patient?.name} description={`${a.admissionNumber} • ${a.status}`}/></List.Item>}/></Card><Card style={{marginTop:18}} title="Wage / Commission Summary" extra={<CurrencyText value={wage?.total}/> }><List dataSource={wage?.rows||[]} renderItem={r=><List.Item><List.Item.Meta title={r.patient?.name} description={`${r.wageType} • Units ${r.units}`}/><CurrencyText value={r.amount}/></List.Item>}/></Card></Card>}</>;
}

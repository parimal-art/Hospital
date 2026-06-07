import { Button, Card, DatePicker, Select, Space, Table, Typography } from 'antd';
import React from 'react';
import { useState } from 'react';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import ExportButton from '../../components/ExportButton.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';

const reportOptions = [
 ['day-book','Day Book'], ['trial-balance','Trial Balance'], ['balance-sheet','Balance Sheet'], ['payment-details','Payment Details'], ['billing','Normal Billing Invoice Report'], ['admission-discharge','IPD Admission to Discharge'], ['doctor-wages','Doctor Wage Report'], ['daily-bed-rent','Daily Bed Rent'], ['daily-expense','Daily Expense'], ['pending-dues','Pending Dues'], ['ipd-notes','IPD Notes Upload'], ['employee-verification','Employee Verification'], ['patient-commission','Patient Name-wise Commission']
].map(([value,label])=>({value,label}));

export default function ReportsHub(){
 const [report,setReport]=useState('day-book'); const [range,setRange]=useState([]); const [rows,setRows]=useState([]); const [raw,setRaw]=useState(null); const [loading,setLoading]=useState(false);
 const run=async()=>{setLoading(true); try{const params={}; if(range?.[0]) params.from=range[0].toISOString(); if(range?.[1]) params.to=range[1].toISOString(); const {data}=await api.get(`/reports/${report}`,{params}); setRaw(data.data); const val=data.data?.rows||data.data; setRows(Array.isArray(val)?val: Object.entries(val||{}).map(([key,value])=>({group:key,value:JSON.stringify(value)})));} finally{setLoading(false)}};
 const columns = rows[0] ? Object.keys(rows[0]).filter(k=>!['_id','__v'].includes(k)).slice(0,8).map(k=>({title:k,dataIndex:k,render:v=> typeof v==='object' ? (v?.name||v?.registrationNumber||v?.admissionNumber||JSON.stringify(v).slice(0,80)) : (typeof v==='number'? <CurrencyText value={v}/>: String(v ?? '-'))})) : [];
 return <><PageHeader title="Reports" subtitle="Date-range financial, IPD, billing, doctor, document and employee verification reports." /><Card className="page-card"><Space wrap><Select value={report} onChange={setReport} options={reportOptions} style={{width:280}}/><DatePicker.RangePicker onChange={setRange}/><Button type="primary" onClick={run} loading={loading}>Generate</Button><ExportButton rows={rows} filename={`${report}.csv`}/><Button onClick={()=>window.print()}>Print</Button></Space>{raw?.summary&&<Typography.Paragraph style={{marginTop:16}}>Summary: {JSON.stringify(raw.summary)}</Typography.Paragraph>}<Table style={{marginTop:18}} rowKey={(r,i)=>r._id||i} dataSource={rows} columns={columns} loading={loading} scroll={{x:1000}}/></Card></>;
}

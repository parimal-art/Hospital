import { Card } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function AuditLogs(){ const [rows,setRows]=useState([]); const [loading,setLoading]=useState(false); const load=async()=>{setLoading(true); try{setRows((await api.get('/audit-logs')).data.data)}finally{setLoading(false)}}; useEffect(()=>{load()},[]); const columns=[{title:'Date',dataIndex:'createdAt',render:formatDateTime},{title:'User',render:(_,r)=>r.user?.name||'-'},{title:'Role',dataIndex:'role'},{title:'Module',dataIndex:'module'},{title:'Action',dataIndex:'action'},{title:'IP',dataIndex:'ipAddress'}]; return <><PageHeader title="Audit Logs" subtitle="Sensitive action history and compliance trail."/><Card className="page-card"><DataTable columns={columns} data={rows} loading={loading}/></Card></>; }

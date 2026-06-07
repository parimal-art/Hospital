import { Card, List } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDateTime } from '../../utils/formatDate.js';

export default function Notifications(){ const [rows,setRows]=useState([]); useEffect(()=>{api.get('/notifications').then(r=>setRows(r.data.data))},[]); return <><PageHeader title="Notifications" subtitle="System alerts for employee documents, admissions, payments and billing approvals."/><Card className="page-card"><List dataSource={rows} renderItem={n=><List.Item><List.Item.Meta title={n.title} description={`${n.message || ''} • ${formatDateTime(n.createdAt)}`}/></List.Item>}/></Card></>; }

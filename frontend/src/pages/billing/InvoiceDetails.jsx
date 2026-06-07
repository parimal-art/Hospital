import { Card, Descriptions, Table, Typography } from 'antd';
import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import PageHeader from '../../components/PageHeader.jsx';
import PrintButton from '../../components/PrintButton.jsx';
import StatusTag from '../../components/StatusTag.jsx';
import CurrencyText from '../../components/CurrencyText.jsx';
import { formatDate } from '../../utils/formatDate.js';

export default function InvoiceDetails(){
 const {id}=useParams(); const [invoice,setInvoice]=useState(null); useEffect(()=>{api.get(`/invoices/${id}`).then(r=>setInvoice(r.data.data))},[id]);
 return <><PageHeader title="Invoice Details" subtitle="Print-friendly invoice view." extra={<PrintButton/>}/>{invoice&&<Card className="page-card print-page"><Typography.Title level={3}>Clinic IPD & Accounts Management System</Typography.Title><Descriptions bordered column={{xs:1,md:2}}><Descriptions.Item label="Invoice No">{invoice.invoiceNumber}</Descriptions.Item><Descriptions.Item label="Status"><StatusTag value={invoice.status}/></Descriptions.Item><Descriptions.Item label="Patient">{invoice.patient?.name||'-'}</Descriptions.Item><Descriptions.Item label="Date">{formatDate(invoice.date)}</Descriptions.Item><Descriptions.Item label="Type">{invoice.invoiceType}</Descriptions.Item><Descriptions.Item label="Payment Mode">{invoice.paymentMode||'-'}</Descriptions.Item></Descriptions><Table style={{marginTop:20}} rowKey="_id" pagination={false} dataSource={invoice.items||[]} columns={[{title:'Service',dataIndex:'serviceName'},{title:'Qty',dataIndex:'quantity'},{title:'Rate',dataIndex:'rate',render:v=><CurrencyText value={v}/>},{title:'Discount',dataIndex:'discount',render:v=><CurrencyText value={v}/>},{title:'Tax',dataIndex:'tax',render:v=><CurrencyText value={v}/>},{title:'Total',dataIndex:'total',render:v=><CurrencyText value={v}/>}]} /><Descriptions style={{marginTop:20}} bordered column={1}><Descriptions.Item label="Total"><CurrencyText value={invoice.total}/></Descriptions.Item><Descriptions.Item label="Paid"><CurrencyText value={invoice.paidAmount}/></Descriptions.Item><Descriptions.Item label="Balance"><CurrencyText value={invoice.balanceAmount}/></Descriptions.Item><Descriptions.Item label="Refund"><CurrencyText value={invoice.refundAmount}/></Descriptions.Item></Descriptions></Card>}</>;
}

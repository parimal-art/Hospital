import { Button, Popconfirm } from 'antd';
import React from 'react';
export default function ConfirmAction({ title = 'Are you sure?', onConfirm, children, danger, type = 'link' }) {
  return <Popconfirm title={title} onConfirm={onConfirm}><Button type={type} danger={danger}>{children}</Button></Popconfirm>;
}

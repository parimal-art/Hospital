import { Button, Drawer, Form, Space } from 'antd';
import React from 'react';

export default function FormDrawer({ title, open, onClose, onSubmit, children, form, loading, width = 560 }) {
  return (
    <Drawer title={title} open={open} onClose={onClose} width={width} destroyOnClose extra={<Button onClick={onClose}>Close</Button>}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        {children}
        <Space style={{ marginTop: 12 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
        </Space>
      </Form>
    </Drawer>
  );
}

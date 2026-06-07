import { Card, Empty, Table } from 'antd';
import React from 'react';

export default function DataTable({ columns, data, loading, rowKey = '_id', onRow, scrollX = 1100 }) {
  return (
    <Card className="page-card">
      <Table
        rowKey={rowKey}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: <Empty description="No records found" /> }}
        scroll={{ x: scrollX }}
        onRow={onRow}
      />
    </Card>
  );
}

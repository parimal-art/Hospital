import { Button, DatePicker, Input, Select, Space } from 'antd';
import React from 'react';
import { FiSearch, FiRefreshCcw } from 'react-icons/fi';

export default function SearchFilterBar({ search, setSearch, filters = [], onRefresh, onDateChange }) {
  return (
    <div className="table-toolbar">
      <Space wrap>
        <Input
          allowClear
          prefix={<FiSearch />}
          placeholder="Search keyword"
          value={search}
          onChange={(e) => setSearch?.(e.target.value)}
          style={{ width: 240 }}
        />
        {filters.map((f) => (
          <Select key={f.key} allowClear placeholder={f.placeholder} options={f.options} onChange={(v) => f.onChange(v)} style={{ width: f.width || 180 }} />
        ))}
        {onDateChange && <DatePicker.RangePicker onChange={onDateChange} />}
      </Space>
      <Button icon={<FiRefreshCcw />} onClick={onRefresh}>Refresh</Button>
    </div>
  );
}

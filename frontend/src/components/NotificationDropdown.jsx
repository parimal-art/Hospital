import { Badge, Button, Dropdown, Empty, List, Typography } from 'antd';
import React from 'react';
import { FiBell } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import api from '../api/axiosInstance.js';
import { formatDateTime } from '../utils/formatDate.js';

export default function NotificationDropdown() {
  const [items, setItems] = useState([]);
  const load = async () => {
    const { data } = await api.get('/notifications?limit=10');
    setItems(data.data || []);
  };
  useEffect(() => { load(); }, []);
  const unread = items.filter((n) => !n.isRead).length;
  const menu = (
    <div style={{ width: 360, maxHeight: 480, overflow: 'auto', background: '#fff', padding: 12, borderRadius: 12 }}>
      {items.length ? <List dataSource={items} renderItem={(item) => (
        <List.Item onClick={async () => { await api.patch(`/notifications/${item._id}/read`); load(); }} style={{ cursor: 'pointer' }}>
          <List.Item.Meta
            title={<Typography.Text strong={!item.isRead}>{item.title}</Typography.Text>}
            description={<>{item.message}<br /><small>{formatDateTime(item.createdAt)}</small></>}
          />
        </List.Item>
      )} /> : <Empty description="No notifications" />}
    </div>
  );
  return <Dropdown dropdownRender={() => menu} trigger={['click']}><Badge count={unread}><Button shape="circle" icon={<FiBell />} /></Badge></Dropdown>;
}

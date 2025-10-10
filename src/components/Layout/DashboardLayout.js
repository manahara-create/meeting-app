import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Avatar, Dropdown, Space,
  Typography, Card, Row, Col, Statistic, Calendar, Badge,
  Drawer, List, Tag, Tooltip, Empty
} from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  onChange as onStoreChange, get as getStore, unreadCount as getUnread,
  markRead, markAllRead, remove as removeItem, clear as clearAll
} from '../notifications/store';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function typeToColor(t) {
  switch (t) {
    case 'success': return 'green'
    case 'error': return 'red'
    case 'warning': return 'orange'
    case 'info': return 'blue'
    default: return 'default'
  }
}

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [items, setItems] = useState(getStore());
  const [unread, setUnread] = useState(getUnread());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    const unsub = onStoreChange((list, unreadCount) => {
      setItems(list);
      setUnread(unreadCount);
    });
    return () => unsub && unsub();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/departments',
      icon: <CrownOutlined />,
      label: 'Departments',
    },
    {
      key: '/personal',
      icon: <UserOutlined />,
      label: 'Personal',
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: 32,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'MA' : 'Schedule Manager Pro'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: 0,
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 24
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          <Space size="large">
            <Tooltip title="Notifications">
              <Badge count={unread} size="small">
                <Button type="text" icon={<BellOutlined />} onClick={() => setDrawerOpen(true)} />
              </Badge>
            </Tooltip>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.email}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={<Space><BellOutlined /><span>Notifications</span>{unread > 0 && <Tag color="processing">{unread} unread</Tag>}</Space>}
        placement="right"
        width={420}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        extra={<Space><Button onClick={() => markAllRead()}>Mark all read</Button><Button danger onClick={() => clearAll()}>Clear all</Button></Space>}
      >
        {items.length === 0 ? (
          <Empty description="No notifications yet" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={items}
            renderItem={item => (
              <List.Item
                key={item.id}
                actions={[
                  <Tooltip title={item.read ? 'Mark unread' : 'Mark read'} key="mark">
                    <Button size="small" icon={<CheckOutlined />} type={item.read ? 'default' : 'primary'} onClick={() => markRead(item.id, !item.read)} />
                  </Tooltip>,
                  <Tooltip title="Remove" key="remove">
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(item.id)} />
                  </Tooltip>
                ]}
                extra={<Tag color={typeToColor(item.type)}>{item.type}</Tag>}
              >
                <List.Item.Meta
                  title={<div style={{ fontWeight: item.read ? 400 : 600 }}>{item.title || '(no title)'}</div>}
                  description={<div style={{ color: '#555' }}>{item.description || ''}</div>}
                />
                <div style={{ fontSize: 12, color: '#888' }}>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}</div>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </Layout>
  );
};

export default DashboardLayout;
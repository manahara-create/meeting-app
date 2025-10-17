import React, { useState, useEffect } from 'react';
import {
  Layout, Menu, Button, Avatar, Dropdown, Space,
  Typography, Card, Row, Col, Statistic, Calendar, Badge,
  Drawer, List, Tag, Tooltip, Empty, Image
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
  CrownOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  onChange as onStoreChange, get as getStore, unreadCount as getUnread,
  markRead, markAllRead, remove as removeItem, clear as clearAll
} from '../notifications/store';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function typeToColor(t) {
  switch (t) {
    case 'success': return '#27ae60'
    case 'error': return '#e74c3c'
    case 'warning': return '#f39c12'
    case 'info': return '#3498db'
    default: return '#7f8c8d'
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

  const handlePersonal = async () => {
    navigate('/personal');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined style={{ color: '#3498db' }} />,
      label: 'Profile',
      onClick: handlePersonal,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#e74c3c' }} />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ color: '#3498db' }} />,
      label: 'Dashboard',
    },
    {
      key: '/departments',
      icon: <CrownOutlined style={{ color: '#f39c12' }} />,
      label: 'Departments',
    },
    {
      key: '/personal',
      icon: <UserOutlined style={{ color: '#27ae60' }} />,
      label: 'Personal',
    }
  ];

  return (
    <Layout style={{
      minHeight: '100vh',
      background: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay'
    }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(145deg, #2c3e50 0%, #34495e 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Logo Section */}
        <div style={{
          height: 80,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {collapsed ? (
            <Image
              src="/images/main-app-logo.png"
              alt="Schedify"
              preview={false}
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          ) : (
            <Space direction="vertical" size={0} align="center">
              <Image
                src="/images/main-app-logo.png"
                alt="Schedify"
                preview={false}
                style={{
                  height: '35px',
                  width: 'auto',
                  objectFit: 'contain',
                  marginBottom: 4
                }}
              />
            </Space>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0 8px'
          }}
        />

        {/* AIPL Logo in Sidebar */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center'
        }}>
          <Text style={{
            display: 'block',
            marginBottom: 8,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '600'
          }}>
            Schedule Application For
          </Text>
          <Image
            src="/images/aipl.png"
            alt="AIPL"
            preview={false}
            style={{
              height: '30px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        </div>
      </Sider>

      {/* Main Content Area */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Button
            type="text"
            icon={collapsed ?
              <MenuUnfoldOutlined style={{ color: '#2c3e50', fontSize: '18px' }} /> :
              <MenuFoldOutlined style={{ color: '#2c3e50', fontSize: '18px' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 64,
              height: 64,
              borderRadius: '8px'
            }}
          />

          <Space size="large">
            {/* Notifications Bell */}
            <Tooltip title="Notifications">
              <Badge
                count={unread}
                size="small"
                style={{
                  backgroundColor: '#e74c3c',
                  boxShadow: '0 0 0 2px #fff'
                }}
              >
                <Button
                  type="text"
                  icon={<BellOutlined style={{ color: '#2c3e50', fontSize: '18px' }} />}
                  onClick={() => setDrawerOpen(true)}
                  style={{
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                />
              </Badge>
            </Tooltip>

            {/* User Dropdown */}
            <Dropdown
              menu={{
                items: userMenuItems,
                style: {
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }
              }}
              placement="bottomRight"
            >
              <Space style={{
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '8px',
                transition: 'all 0.3s',
                ':hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    backgroundColor: '#3498db',
                    boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)'
                  }}
                />
                <Text style={{
                  color: '#2c3e50',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {user?.email}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content style={{
          margin: '24px',
          padding: 0,
          minHeight: 280
        }}>
          <Card
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: 'none',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
              minHeight: 'calc(100vh - 112px)'
            }}
            bodyStyle={{
              padding: '32px'
            }}
          >
            {/* Page Header */}
            <div style={{
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: '2px solid #e8e8e8'
            }}>
              <Title level={2} style={{
                color: '#2c3e50',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <IdcardOutlined style={{ color: '#3498db' }} />
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/departments' && 'Departments'}
                {location.pathname === '/personal' && 'Personal Schedule'}
              </Title>
              <Text style={{
                color: '#7f8c8d',
                fontSize: '16px'
              }}>
                Welcome back, {user?.user_metadata?.full_name || user?.email}
              </Text>
            </div>

            {/* Page Content */}
            <Outlet />
          </Card>
        </Content>
      </Layout>

      {/* Notifications Drawer */}
      <Drawer
        title={
          <Space>
            <BellOutlined style={{ color: '#3498db' }} />
            <span style={{ fontWeight: '600', color: '#2c3e50' }}>Notifications</span>
            {unread > 0 && (
              <Tag
                color="#e74c3c"
                style={{
                  fontWeight: '600',
                  border: 'none'
                }}
              >
                {unread} unread
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width={420}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        extra={
          <Space>
            <Button
              onClick={() => markAllRead()}
              style={{
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Mark all read
            </Button>
            <Button
              danger
              onClick={() => clearAll()}
              style={{
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              Clear all
            </Button>
          </Space>
        }
        styles={{
          body: {
            padding: '0 8px'
          },
          header: {
            borderBottom: '1px solid #e8e8e8'
          }
        }}
      >
        {items.length === 0 ? (
          <Empty
            description="No notifications yet"
            imageStyle={{ marginBottom: 16 }}
            style={{ marginTop: 32 }}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={items}
            renderItem={item => (
              <List.Item
                key={item.id}
                style={{
                  padding: '16px',
                  margin: '8px 0',
                  borderRadius: '12px',
                  background: item.read ? '#fafafa' : '#ffffff',
                  border: `2px solid ${item.read ? '#e8e8e8' : typeToColor(item.type)}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                actions={[
                  <Tooltip title={item.read ? 'Mark unread' : 'Mark read'} key="mark">
                    <Button
                      size="small"
                      icon={<CheckOutlined />}
                      type={item.read ? 'default' : 'primary'}
                      onClick={() => markRead(item.id, !item.read)}
                      style={{
                        borderRadius: '6px'
                      }}
                    />
                  </Tooltip>,
                  <Tooltip title="Remove" key="remove">
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeItem(item.id)}
                      style={{
                        borderRadius: '6px'
                      }}
                    />
                  </Tooltip>
                ]}
                extra={
                  <Tag
                    color={typeToColor(item.type)}
                    style={{
                      border: 'none',
                      fontWeight: '600',
                      borderRadius: '6px'
                    }}
                  >
                    {item.type}
                  </Tag>
                }
              >
                <List.Item.Meta
                  title={
                    <div style={{
                      fontWeight: item.read ? 500 : 700,
                      color: '#2c3e50',
                      fontSize: '15px'
                    }}>
                      {item.title || '(no title)'}
                    </div>
                  }
                  description={
                    <div style={{
                      color: '#7f8c8d',
                      fontSize: '14px',
                      lineHeight: 1.5
                    }}>
                      {item.description || ''}
                    </div>
                  }
                />
                <div style={{
                  fontSize: 12,
                  color: '#95a5a6',
                  marginTop: 8
                }}>
                  {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </Layout>
  );
};

export default DashboardLayout;
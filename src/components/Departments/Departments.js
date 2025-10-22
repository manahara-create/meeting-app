import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Button, Row, Col, Typography, Alert,
  Space, Tag, Statistic, Spin, Empty, Result,
  Modal, message, Divider, Tooltip, Badge,
  Tabs, Switch, Pagination, Table, List, Avatar
} from 'antd';
import {
  TeamOutlined, UserOutlined, CrownOutlined,
  ArrowRightOutlined, CalendarOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SyncOutlined, ClockCircleOutlined,
  EyeOutlined, InfoCircleOutlined, SafetyCertificateOutlined,
  WarningOutlined, FrownOutlined, ReloadOutlined,
  AppstoreOutlined, BarsOutlined, FilterOutlined,
  SearchOutlined, FileTextOutlined, DatabaseOutlined,
  UsergroupAddOutlined, BarChartOutlined, LoginOutlined,
  RocketOutlined, ShopOutlined, GlobalOutlined,
  CustomerServiceOutlined, ClusterOutlined, HeartOutlined,
  DollarOutlined, LaptopOutlined, SolutionOutlined,
  ImportOutlined, SettingOutlined, SafetyOutlined,
  ShopFilled, MedicineBoxOutlined, FileImageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Comprehensive Department configuration for all 21 departments
const departmentConfig = {
  'After Sales': {
    name: 'After Sales',
    color: '#ff4d4f', // Red
    emoji: '🔧',
    description: 'After Sales Service and Support',
    icon: <CustomerServiceOutlined />,
    gradient: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
    url: '/departments/after-sales',
    person: 'Not Confrimed Yet'
  },
  'BDM': {
    name: 'BDM',
    color: '#1890ff', // Blue
    emoji: '🚀',
    description: 'Business Development Management',
    icon: <RocketOutlined />,
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    url: '/departments/bdm',
    person: 'Prasadi Nuwanthika'
  },
  'Cluster 1': {
    name: 'Cluster 1',
    color: '#52c41a', // Green
    emoji: '🏢',
    description: 'Cluster 1 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    url: '/departments/cluster-1',
    person: 'Imesha Nilakshi'
  },
  'Cluster 2': {
    name: 'Cluster 2',
    color: '#faad14', // Gold
    emoji: '🏢',
    description: 'Cluster 2 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
    url: '/departments/cluster-2',
    person: 'Pradheesha Jeromie'
  },
  'Cluster 3': {
    name: 'Cluster 3',
    color: '#13c2c2', // Cyan
    emoji: '🏢',
    description: 'Cluster 3 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    url: '/departments/cluster-3',
    person: 'Gayathri Silva'
  },
  'Cluster 4': {
    name: 'Cluster 4',
    color: '#722ed1', // Purple
    emoji: '🏢',
    description: 'Cluster 4 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    url: '/departments/cluster-4',
    person: 'Imesha Nilakshi'
  },
  'Cluster 5': {
    name: 'Cluster 5',
    color: '#eb2f96', // Magenta
    emoji: '🏢',
    description: 'Cluster 5 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
    url: '/departments/cluster-5',
    person: 'Pradheesha Jeromie'
  },
  'Cluster 6': {
    name: 'Cluster 6',
    color: '#fa541c', // Volcano
    emoji: '🏢',
    description: 'Cluster 6 Operations',
    icon: <ClusterOutlined />,
    gradient: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
    url: '/departments/cluster-6',
    person: 'Gayathri Silva'
  },
  'Customer Care': {
    name: 'Customer Care',
    color: '#1890ff', // Blue
    emoji: '💁',
    description: 'Customer Care and Support',
    icon: <CustomerServiceOutlined />,
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    url: '/departments/customer-care',
    person: 'Rashmika Premathilaka'
  },
  'E-Healthcare': {
    name: 'E-Healthcare',
    color: '#52c41a', // Green
    emoji: '🏥',
    description: 'E-Healthcare Services',
    icon: <MedicineBoxOutlined />,
    gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    url: '/departments/e-healthcare',
    person: 'Dhara Nethmi'
  },
  'Finance': {
    name: 'Finance',
    color: '#faad14', // Gold
    emoji: '💰',
    description: 'Finance and Accounting',
    icon: <DollarOutlined />,
    gradient: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
    url: '/departments/finance',
    person: 'Not Confrimed Yet'
  },
  'Hi-Tech': {
    name: 'Hi-Tech',
    color: '#13c2c2', // Cyan
    emoji: '🔬',
    description: 'Hi-Tech Solutions',
    icon: <LaptopOutlined />,
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    url: '/departments/hi-tech',
    person: 'Sahiru Chathuranga'
  },
  'HR': {
    name: 'HR',
    color: '#722ed1', // Purple
    emoji: '👥',
    description: 'Human Resources',
    icon: <TeamOutlined />,
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    url: '/departments/hr',
    person: 'Nethmini Koshila'
  },
  'Imports': {
    name: 'Imports',
    color: '#eb2f96', // Magenta
    emoji: '📦',
    description: 'Import Operations',
    icon: <ImportOutlined />,
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
    url: '/departments/imports',
    person: 'Subhashini Sandamalie'
  },
  'IT': {
    name: 'IT',
    color: '#fa541c', // Volcano
    emoji: '💻',
    description: 'Information Technology',
    icon: <SettingOutlined />,
    gradient: 'linear-gradient(135deg, #fa541c 0%, #d4380d 100%)',
    url: '/departments/it',
    person: 'Not Yet Confrimed'
  },
  'Regulatory': {
    name: 'Regulatory',
    color: '#1890ff', // Blue
    emoji: '📋',
    description: 'Regulatory Affairs',
    icon: <SafetyCertificateOutlined />,
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    url: '/departments/regulatory',
    person: 'Hiruni Achinthya'
  },
  'Sales Operations': {
    name: 'Sales Operations',
    color: '#52c41a', // Green
    emoji: '📊',
    description: 'Sales Operations Management',
    icon: <ShopOutlined />,
    gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
    url: '/departments/sales-operations',
    person: 'Imesha Nilakshi'
  },
  'SOMT': {
    name: 'SOMT',
    color: '#faad14', // Gold
    emoji: '🔄',
    description: 'Sales Operations Management Team',
    icon: <SolutionOutlined />,
    gradient: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
    url: '/departments/somt',
    person: 'Rahul Rupkumar'
  },
  'Stores': {
    name: 'Stores',
    color: '#13c2c2', // Cyan
    emoji: '🏪',
    description: 'Store Operations',
    icon: <ShopFilled />,
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    url: '/departments/stores',
    person: 'Suranga Silva'
  },
  'Surge-Surgecare': {
    name: 'Surge-Surgecare',
    color: '#722ed1', // Purple
    emoji: '⚡',
    description: 'Surge and Surgecare Services',
    icon: <MedicineBoxOutlined />,
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    url: '/departments/surge-surgecare',
    person: 'Shahan Anthony'
  },
  'Surge-Surgecare-Image': {
    name: 'Surge-Surgecare-Image',
    color: '#eb2f96', // Magenta
    emoji: '🖼️',
    description: 'Surgecare Imaging Services',
    icon: <FileImageOutlined />,
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)',
    url: '/departments/surge-surgecare-image',
    person: 'Selvarathnam Rajnikanth'
  }
};


// Loading component
const LoadingSpinner = ({ tip = "Loading departments data..." }) => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" tip={tip} />
  </div>
);

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Result
    status="error"
    title="Something went wrong"
    subTitle={error?.message || "An unexpected error occurred"}
    extra={
      <Button type="primary" onClick={resetErrorBoundary} size="large">
        Try Again
      </Button>
    }
  />
);

// Department Card Component
const DepartmentCard = ({ department, userCount, onNavigate, loading = false }) => {
  const config = departmentConfig[department.name] || {
    name: department.name,
    color: '#666',
    emoji: '🏢',
    description: department.description || 'Department',
    icon: <TeamOutlined />,
    gradient: 'linear-gradient(135deg, #666 0%, #444 100%)',
    url: `/departments/${department.name.toLowerCase().replace(/\s+/g, '-')}`
  };

  const hasUsers = userCount > 0;

  return (
    <Card
      hoverable
      loading={loading}
      style={{
        height: '100%',
        border: `2px solid ${config.color}30`,
        borderRadius: '16px',
        transition: 'all 0.3s ease',
        background: `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      bodyStyle={{
        padding: '24px',
        textAlign: 'center'
      }}
      onClick={() => !loading && onNavigate(department.name, hasUsers)}
    >
      {/* Emoji and Icon Header */}
      <div style={{
        fontSize: '48px',
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '40px' }}>{config.emoji}</span>
        <div style={{
          color: config.color,
          fontSize: '32px'
        }}>
          {config.icon}
        </div>
      </div>

      {/* Department Name with Color */}
      <Title level={3} style={{
        color: config.color,
        marginBottom: '8px',
        background: config.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {config.name}
      </Title>

      <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
        {config.description}
      </Text>

      <Divider style={{ margin: '16px 0', borderColor: `${config.color}20` }} />

      {/* User Count with Styling */}
      <div style={{ marginBottom: '16px' }}>
        <Statistic
          title={
            <Text style={{ color: config.color, fontWeight: 600 }}>
              Team Members
            </Text>
          }
          value={userCount || 0}
          prefix={<UserOutlined style={{ color: config.color }} />}
          valueStyle={{
            fontSize: '28px',
            color: config.color,
            fontWeight: 'bold'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Statistic
          title={
            <Text style={{ color: config.color, fontWeight: 100 }}>
              Responsible Person
            </Text>
          }
          value={config.person || 'Not Confirmed Yet'}
          prefix={<UserOutlined style={{ color: config.color }} />}
          valueStyle={{
            fontSize: '20px',
            color: config.color,
            fontWeight: 'bold'
          }}
        />
      </div>

      {/* Action Button */}
      <Button
        type="primary"
        size="large"
        style={{
          background: config.gradient,
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          marginTop: '8px',
          height: '44px',
          fontSize: '16px',
          boxShadow: `0 4px 12px ${config.color}40`
        }}
        icon={hasUsers ? <ArrowRightOutlined /> : <LoginOutlined />}
        block
      >
        {hasUsers ? 'Enter Department' : 'Explore Department'}
      </Button>
    </Card>
  );
};

// Department List View Component
const DepartmentListView = ({ departments, userCounts, onNavigate, loading }) => {
  return (
    <Card
      title={
        <Space>
          <BarsOutlined />
          <Text strong>Department List View</Text>
          <Tag color="blue">{departments.length} Departments</Tag>
        </Space>
      }
      loading={loading}
      style={{ borderRadius: '12px' }}
    >
      <List
        itemLayout="horizontal"
        dataSource={departments}
        renderItem={(dept) => {
          const config = departmentConfig[dept.name] || {
            name: dept.name,
            color: '#666',
            emoji: '🏢',
            icon: <TeamOutlined />,
            gradient: 'linear-gradient(135deg, #666 0%, #444 100%)',
            url: `/departments/${dept.name.toLowerCase().replace(/\s+/g, '-')}`
          };
          const userCount = userCounts[dept.id] || 0;
          const hasUsers = userCount > 0;

          return (
            <List.Item
              style={{
                padding: '16px',
                margin: '8px 0',
                border: `1px solid ${config.color}20`,
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${config.color}08 0%, ${config.color}03 100%)`
              }}
              actions={[
                <Button
                  type="primary"
                  style={{
                    background: config.gradient,
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}
                  icon={hasUsers ? <ArrowRightOutlined /> : <LoginOutlined />}
                  onClick={() => onNavigate(dept.name, hasUsers)}
                >
                  {hasUsers ? 'View' : 'Explore'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="large"
                    style={{
                      background: config.gradient,
                      color: '#fff',
                      fontSize: '16px'
                    }}
                    icon={<span style={{ fontSize: '20px' }}>{config.emoji}</span>}
                  />
                }
                title={
                  <Space>
                    <Text strong style={{
                      color: config.color,
                      fontSize: '18px'
                    }}>
                      {config.name}
                    </Text>
                    {!hasUsers && (
                      <Tag
                        color="blue"
                        icon={<InfoCircleOutlined />}
                        style={{ border: `1px solid ${config.color}30` }}
                      >
                        No Active Users
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {config.description}
                    </Text>
                    <Space>
                      <UserOutlined style={{ color: config.color }} />
                      <Text strong style={{ color: config.color }}>
                        {userCount} team member{userCount !== 1 ? 's' : ''}
                      </Text>
                      {hasUsers ? (
                        <Tag
                          color="green"
                          icon={<CheckCircleOutlined />}
                          style={{ border: '1px solid #52c41a30' }}
                        >
                          Active Team
                        </Tag>
                      ) : (
                        <Tag
                          color="blue"
                          icon={<InfoCircleOutlined />}
                          style={{ border: `1px solid ${config.color}30` }}
                        >
                          Available
                        </Tag>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

// Department Statistics Component
const DepartmentStatistics = ({ stats, loading = false }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
    <Col xs={24} sm={8} md={6}>
      <Card
        size="small"
        style={{
          textAlign: 'center',
          border: '2px solid #1890ff20',
          borderRadius: '8px'
        }}
        loading={loading}
      >
        <Statistic
          title="Total Departments"
          value={stats?.totalDepartments || 0}
          prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
          valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card
        size="small"
        style={{
          textAlign: 'center',
          border: '2px solid #52c41a20',
          borderRadius: '8px'
        }}
        loading={loading}
      >
        <Statistic
          title="Total Users"
          value={stats?.totalUsers || 0}
          prefix={<UserOutlined style={{ color: '#52c41a' }} />}
          valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card
        size="small"
        style={{
          textAlign: 'center',
          border: '2px solid #fa8c1620',
          borderRadius: '8px'
        }}
        loading={loading}
      >
        <Statistic
          title="Departments with Users"
          value={stats?.departmentsWithUsers || 0}
          prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
          valueStyle={{ color: '#fa8c16', fontSize: '20px', fontWeight: 'bold' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card
        size="small"
        style={{
          textAlign: 'center',
          border: '2px solid #722ed120',
          borderRadius: '8px'
        }}
        loading={loading}
      >
        <Statistic
          title="Available Departments"
          value={stats?.departmentsWithoutUsers || 0}
          prefix={<InfoCircleOutlined style={{ color: '#722ed1' }} />}
          valueStyle={{ color: '#722ed1', fontSize: '20px', fontWeight: 'bold' }}
        />
      </Card>
    </Col>
  </Row>
);

// Enhanced Departments Component
const Departments = () => {
  // State for error handling
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const [departments, setDepartments] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Stats state
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalUsers: 0,
    departmentsWithUsers: 0,
    departmentsWithoutUsers: 0
  });

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  const navigate = useNavigate();

  // Error boundary reset function
  const resetErrorBoundary = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    fetchDepartmentsData();
  };

  // Global error handler
  const handleError = (error, context = 'Unknown operation') => {
    console.error(`Error in ${context}:`, error);

    const errorMessage = error?.message || 'An unexpected error occurred';

    if (!context.includes('auto-refresh')) {
      toast.error(`Error in ${context}: ${errorMessage}`);
    }

    setError({
      message: errorMessage,
      context,
      timestamp: new Date().toISOString()
    });

    return error;
  };

  // Safe state update wrapper
  const safeSetState = (setter, value) => {
    try {
      setter(value);
    } catch (err) {
      handleError(err, 'state update');
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
    setupAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [retryCount]);

  const setupAutoRefresh = () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (autoRefresh) {
        refreshIntervalRef.current = setInterval(() => {
          refreshDepartmentsData();
        }, 2 * 60 * 1000); // 2 minutes
      }
    } catch (error) {
      handleError(error, 'setting up auto-refresh');
    }
  };

  const refreshDepartmentsData = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchDepartmentsData();
      safeSetState(setLastRefresh, new Date());
      toast.info('Departments data updated automatically');
    } catch (error) {
      handleError(error, 'auto-refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDepartmentsData();
      safeSetState(setLastRefresh, new Date());
      toast.success('Departments refreshed successfully');
    } catch (error) {
      handleError(error, 'manual refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoRefreshToggle = (checked) => {
    try {
      safeSetState(setAutoRefresh, checked);
      if (checked) {
        setupAutoRefresh();
        toast.info('Auto-refresh enabled (every 2 minutes)');
      } else {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        toast.info('Auto-refresh disabled');
      }
    } catch (error) {
      handleError(error, 'toggle auto-refresh');
    }
  };

  const fetchDepartmentsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentUser(),
        fetchDepartments(),
        fetchUserCounts()
      ]);
    } catch (error) {
      handleError(error, 'fetching departments data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!user) {
        safeSetState(setCurrentUser, null);
        safeSetState(setCurrentUserRole, null);
        return;
      }

      // FIX for the JSON coercion error - use maybeSingle() instead of single()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        // If it's a "not found" error, it's okay - user might not have a profile yet
        if (profileError.code === 'PGRST116') {
          console.log('User profile not found, creating default profile...');
          safeSetState(setCurrentUser, user);
          safeSetState(setCurrentUserRole, 'user');
          return;
        }
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      safeSetState(setCurrentUser, { ...user, ...profile });
      safeSetState(setCurrentUserRole, profile?.role || 'user');
    } catch (error) {
      console.warn('Error fetching current user:', error);
      // Don't throw error for profile issues, just continue with basic user info
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        safeSetState(setCurrentUser, user);
        safeSetState(setCurrentUserRole, 'user');
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      safeSetState(setDepartments, data || []);
    } catch (error) {
      handleError(error, 'fetching departments');
      safeSetState(setDepartments, []);
    }
  };

  const fetchUserCounts = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('department_id');

      if (error) {
        throw new Error(`Failed to fetch user counts: ${error.message}`);
      }

      const counts = {};

      (users || []).forEach(user => {
        if (user.department_id) {
          counts[user.department_id] = (counts[user.department_id] || 0) + 1;
        }
      });

      safeSetState(setUserCounts, counts);
    } catch (error) {
      handleError(error, 'fetching user counts');
      safeSetState(setUserCounts, {});
    }
  };

  const calculateStats = () => {
    try {
      const totalDepartments = departments.length;
      const totalUsers = userCounts ? Object.values(userCounts).reduce((sum, count) => sum + count, 0) : 0;
      const departmentsWithUsers = userCounts ? Object.keys(userCounts).length : 0;
      const departmentsWithoutUsers = totalDepartments - departmentsWithUsers;

      safeSetState(setStats, {
        totalDepartments,
        totalUsers,
        departmentsWithUsers,
        departmentsWithoutUsers
      });

      return { totalDepartments, totalUsers, departmentsWithUsers, departmentsWithoutUsers };
    } catch (error) {
      handleError(error, 'calculating statistics');
      return {
        totalDepartments: 0,
        totalUsers: 0,
        departmentsWithUsers: 0,
        departmentsWithoutUsers: 0
      };
    }
  };

  useEffect(() => {
    calculateStats();
  }, [departments, userCounts]);

  const handleDepartmentClick = (departmentName, hasUsers) => {
    try {
      const config = departmentConfig[departmentName] || {
        name: departmentName,
        color: '#666',
        emoji: '🏢',
        url: `/departments/${departmentName.toLowerCase().replace(/\s+/g, '-')}`
      };

      // Show toast message if no users in department
      if (!hasUsers) {
        toast.warning(
          <div>
            <strong>{config.emoji} Heads up! 🚧</strong>
            <br />
            You're entering <strong style={{ color: config.color }}>{departmentName}</strong> department which currently has no registered users.
            <br />
            <small>While you can explore the department structure, user-specific features won't be available.</small>
          </div>,
          {
            autoClose: 6000,
            position: "top-center",
            style: {
              border: `1px solid ${config.color}30`,
              background: `${config.color}10`
            }
          }
        );
      }

      // Navigate to the department URL
      navigate(config.url);
    } catch (error) {
      handleError(error, 'navigating to department');
      toast.error('Failed to navigate to department page');
    }
  };

  const formatTimeSinceLastRefresh = () => {
    try {
      const now = new Date();
      const diffInSeconds = Math.floor((now - lastRefresh) / 1000);

      if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
      } else {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Unknown';
    }
  };

  const isAdmin = currentUserRole === 'admin';

  // Render error state
  if (error && retryCount > 2) {
    return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
  }

  // Render loading state
  if (loading && !isRefreshing) {
    return <LoadingSpinner tip="Loading 21 departments and user data..." />;
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Departments Error"
          description={`${error.context}: ${error.message}`}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          action={
            <Button size="large" type="primary" onClick={resetErrorBoundary}>
              Retry
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Header with Controls */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          backgroundColor: '#fafafa',
          borderRadius: '12px',
          border: '2px solid #1890ff20'
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
              <TeamOutlined /> Department Overview
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
              Managing {departments.length} departments across the organization
            </Text>
            {!isAdmin && (
              <Tag icon={<CrownOutlined />} color="red" style={{ marginTop: '8px' }}>
                Admin Access Required for Management
              </Tag>
            )}
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                <ClockCircleOutlined /> Last updated: {formatTimeSinceLastRefresh()}
              </Text>
              <Space>
                <Switch
                  checkedChildren="Auto Refresh On"
                  unCheckedChildren="Auto Refresh Off"
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  size="small"
                />
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space style={{ float: 'right' }}>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
                size="small"
              >
                Grid
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<BarsOutlined />}
                onClick={() => setViewMode('list')}
                size="small"
              >
                List
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={manualRefresh}
                loading={isRefreshing}
                size="small"
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {autoRefresh && (
        <Alert
          message="Auto-refresh Enabled"
          description="Departments data will automatically update every 2 minutes."
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {!isAdmin && (
        <Alert
          message="View Only Mode"
          description="You are viewing departments in read-only mode. Only administrators can manage department settings."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Statistics Cards */}
      <DepartmentStatistics stats={stats} loading={isRefreshing} />

      {/* Departments Display - Grid or List View */}
      {viewMode === 'grid' ? (
        <Card
          title={
            <Space>
              <AppstoreOutlined />
              <Text strong>All Departments - Grid View</Text>
              <Tag color="blue">{departments.length} Total</Tag>
              <Tag color="green">{stats.departmentsWithUsers} With Users</Tag>
              <Tag color="purple">{stats.departmentsWithoutUsers} Available</Tag>
            </Space>
          }
          bordered={false}
          style={{ marginTop: 24, borderRadius: '12px' }}
        >
          {departments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No departments found"
            />
          ) : (
            <Row gutter={[16, 16]}>
              {departments.map(dept => (
                <Col xs={24} sm={12} md={8} lg={6} key={dept.id}>
                  <DepartmentCard
                    department={dept}
                    userCount={userCounts[dept.id]}
                    onNavigate={handleDepartmentClick}
                    loading={isRefreshing}
                  />
                </Col>
              ))}
            </Row>
          )}
        </Card>
      ) : (
        <DepartmentListView
          departments={departments}
          userCounts={userCounts}
          onNavigate={handleDepartmentClick}
          loading={isRefreshing}
        />
      )}

      {/* Department Information & Summary */}
      <Card
        title="Department Summary & Information"
        style={{ marginTop: 24, borderRadius: '12px' }}
        extra={
          <Button
            icon={<BarChartOutlined />}
            onClick={() => navigate('/analytics')}
            size="small"
          >
            View Analytics
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title="Department Status Overview" type="inner">
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {departments.map(dept => {
                    const userCount = userCounts[dept.id] || 0;
                    const hasUsers = userCount > 0;
                    const config = departmentConfig[dept.name] || {
                      name: dept.name,
                      color: '#666',
                      emoji: '🏢'
                    };

                    return (
                      <div key={dept.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <Space>
                          <span style={{ fontSize: '20px' }}>{config.emoji}</span>
                          <Text strong style={{ color: config.color }}>
                            {dept.name}
                          </Text>
                        </Space>
                        <Space>
                          <Text style={{ color: config.color, fontWeight: 600 }}>
                            {userCount} user{userCount !== 1 ? 's' : ''}
                          </Text>
                          {hasUsers ? (
                            <Tag color="green" size="small">Active Team</Tag>
                          ) : (
                            <Tag color="blue" size="small">Available</Tag>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </Space>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title="Quick Actions & Information" type="inner">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                  message="All 21 Departments Are Accessible"
                  description="You can explore any department regardless of user count. Departments without users will show a friendly notification."
                  type="info"
                  showIcon
                />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Your Role:</Text>
                  <Tag color={isAdmin ? 'red' : 'blue'}>
                    {isAdmin ? 'Administrator' : 'User'}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Departments with Users:</Text>
                  <Text strong>{stats.departmentsWithUsers}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Available Departments:</Text>
                  <Text strong>{stats.departmentsWithoutUsers}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Total Team Members:</Text>
                  <Text strong>{stats.totalUsers}</Text>
                </div>

                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<UsergroupAddOutlined />}
                    onClick={() => navigate('/admin/user-management')}
                    block
                  >
                    Manage Users & Departments
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Departments;
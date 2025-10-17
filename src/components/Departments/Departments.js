import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card, Button, Row, Col, Typography, Alert,
  Space, Tag, Statistic, Spin, Empty, Result,
  Modal, message, Divider, Tooltip, Badge,
  Tabs, Switch, Pagination
} from 'antd';
import { 
  TeamOutlined, UserOutlined, CrownOutlined,
  ArrowRightOutlined, CalendarOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, SyncOutlined, ClockCircleOutlined,
  EyeOutlined, InfoCircleOutlined, SafetyCertificateOutlined,
  WarningOutlined, FrownOutlined, ReloadOutlined,
  AppstoreOutlined, BarsOutlined, FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Department configuration with enhanced metadata
const departmentConfig = {
  BDM: { 
    name: 'BDM', 
    color: '#3498db',
    description: 'Business Development Management',
    icon: <TeamOutlined />,
    tables: ['bdm_customer_visit', 'bdm_principle_visit', 'bdm_weekly_meetings', 'bdm_college_session', 'bdm_promotional_activities']
  },
  SALES_OPERATIONS: { 
    name: 'Sales Operations', 
    color: '#f39c12',
    description: 'Sales Operations and Management',
    icon: <UserOutlined />,
    tables: ['sales_operations_meetings', 'sales_operations_tasks']
  },
  SCMT: { 
    name: 'SCMT', 
    color: '#27ae60',
    description: 'Supply Chain Management',
    icon: <SafetyCertificateOutlined />,
    tables: ['scmt_d_n_d', 'scmt_meetings_and_sessions', 'scmt_others', 'scmt_weekly_meetings']
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
const DepartmentCard = ({ department, userCount, activityCount, onNavigate, loading = false }) => {
  const config = departmentConfig[department.name] || {
    name: department.name,
    color: '#666',
    description: department.description || 'Department',
    icon: <TeamOutlined />
  };

  return (
    <Card
      hoverable
      loading={loading}
      style={{ 
        height: '100%',
        border: `2px solid ${config.color}20`,
        borderRadius: '12px',
        transition: 'all 0.3s ease'
      }}
      bodyStyle={{ 
        padding: '24px',
        textAlign: 'center'
      }}
      onClick={() => !loading && onNavigate(department.name)}
    >
      <div style={{ 
        fontSize: '48px', 
        color: config.color,
        marginBottom: '16px'
      }}>
        {config.icon}
      </div>
      
      <Title level={3} style={{ color: config.color, marginBottom: '8px' }}>
        {config.name}
      </Title>
      
      <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
        {config.description}
      </Text>

      <Divider style={{ margin: '16px 0' }} />

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <Statistic
            title="Team Members"
            value={userCount || 0}
            prefix={<UserOutlined />}
            valueStyle={{ fontSize: '18px', color: config.color }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Activities"
            value={activityCount || 0}
            prefix={<CalendarOutlined />}
            valueStyle={{ fontSize: '18px', color: config.color }}
          />
        </Col>
      </Row>

      <Button
        type="primary"
        size="large"
        style={{ 
          backgroundColor: config.color,
          borderColor: config.color,
          borderRadius: '6px',
          fontWeight: 'bold',
          marginTop: '8px'
        }}
        icon={<ArrowRightOutlined />}
        block
      >
        Enter Department
      </Button>
    </Card>
  );
};

// Department Statistics Component
const DepartmentStatistics = ({ stats, loading = false }) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
    <Col xs={24} sm={8} md={6}>
      <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
        <Statistic
          title="Total Departments"
          value={stats?.totalDepartments || 0}
          prefix={<TeamOutlined />}
          valueStyle={{ color: '#1890ff', fontSize: '20px' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
        <Statistic
          title="Total Users"
          value={stats?.totalUsers || 0}
          prefix={<UserOutlined />}
          valueStyle={{ color: '#52c41a', fontSize: '20px' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
        <Statistic
          title="Active Departments"
          value={stats?.departmentsWithUsers || 0}
          prefix={<CheckCircleOutlined />}
          valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
        />
      </Card>
    </Col>
    <Col xs={24} sm={8} md={6}>
      <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
        <Statistic
          title="Total Activities"
          value={stats?.totalActivities || 0}
          prefix={<CalendarOutlined />}
          valueStyle={{ color: '#722ed1', fontSize: '20px' }}
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
  const [activityCounts, setActivityCounts] = useState({});
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalUsers: 0,
    departmentsWithUsers: 0,
    totalActivities: 0
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
        fetchUserCounts(),
        fetchActivityCounts()
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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      safeSetState(setCurrentUser, { ...user, ...profile });
      safeSetState(setCurrentUserRole, profile?.role || 'user');
    } catch (error) {
      handleError(error, 'fetching current user');
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

  const fetchActivityCounts = async () => {
    try {
      const counts = {};
      
      // Fetch activity counts from all department tables
      const tablePromises = Object.values(departmentConfig).flatMap(dept => 
        dept.tables.map(async (tableName) => {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('id', { count: 'exact' });

            if (!error && data) {
              const deptKey = Object.keys(departmentConfig).find(
                key => departmentConfig[key].name === dept.name
              );
              
              if (deptKey) {
                counts[deptKey] = (counts[deptKey] || 0) + data.length;
              }
            }
          } catch (tableError) {
            console.warn(`Failed to count activities from ${tableName}:`, tableError);
          }
        })
      );

      await Promise.allSettled(tablePromises);
      safeSetState(setActivityCounts, counts);
    } catch (error) {
      handleError(error, 'fetching activity counts');
      safeSetState(setActivityCounts, {});
    }
  };

  const calculateStats = () => {
    try {
      const totalDepartments = departments.length;
      const totalUsers = userCounts ? Object.values(userCounts).reduce((sum, count) => sum + count, 0) : 0;
      const departmentsWithUsers = userCounts ? Object.keys(userCounts).length : 0;
      const totalActivities = activityCounts ? Object.values(activityCounts).reduce((sum, count) => sum + count, 0) : 0;

      safeSetState(setStats, {
        totalDepartments,
        totalUsers,
        departmentsWithUsers,
        totalActivities
      });

      return { totalDepartments, totalUsers, departmentsWithUsers, totalActivities };
    } catch (error) {
      handleError(error, 'calculating statistics');
      return { totalDepartments: 0, totalUsers: 0, departmentsWithUsers: 0, totalActivities: 0 };
    }
  };

  useEffect(() => {
    calculateStats();
  }, [departments, userCounts, activityCounts]);

  const handleDepartmentClick = (departmentName) => {
    try {
      // Navigate to the corresponding page based on department name
      switch(departmentName) {
        case 'BDM':
          navigate('/departments/bdm');
          break;
        case 'Sales Operations':
          navigate('/departments/sales-operations');
          break;
        case 'SCMT':
          navigate('/departments/scmt');
          break;
        default:
          console.warn('Unknown department:', departmentName);
          toast.warning(`Navigation for ${departmentName} is not configured`);
      }
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
    return <LoadingSpinner tip="Loading departments and statistics..." />;
  }

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
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
        style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
              <TeamOutlined /> Department Management
            </Title>
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

      {/* Department Cards */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <Text strong>Departments</Text>
            <Tag color="blue">{departments.length} Total</Tag>
          </Space>
        }
        bordered={false}
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={manualRefresh}
            loading={isRefreshing}
            size="small"
          >
            Refresh Departments
          </Button>
        }
      >
        {departments.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="No departments found"
          />
        ) : (
          <Row gutter={[24, 24]}>
            {departments.map(dept => {
              const deptKey = Object.keys(departmentConfig).find(
                key => departmentConfig[key].name === dept.name
              );
              
              return (
                <Col xs={24} md={8} key={dept.id}>
                  <DepartmentCard
                    department={dept}
                    userCount={userCounts[dept.id]}
                    activityCount={activityCounts[deptKey]}
                    onNavigate={handleDepartmentClick}
                    loading={isRefreshing}
                  />
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Department Information */}
      <Card 
        title="Department Information & Guidelines"
        style={{ marginTop: 24 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="Department Access"
            description="Click on any department card above to navigate to its dedicated page where you can manage tasks, meetings, and other department-specific activities."
            type="info"
            showIcon
          />
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Available Actions" type="inner">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    <Text strong>View Department Details</Text>
                  </div>
                  <div>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    <Text strong>Access Department-specific Activities</Text>
                  </div>
                  <div>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    <Text strong>Monitor Team Performance</Text>
                  </div>
                  {isAdmin && (
                    <div>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      <Text strong>Manage Department Settings</Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Quick Stats" type="inner">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Your Role:</Text>
                    <Tag color={isAdmin ? 'red' : 'blue'}>
                      {isAdmin ? 'Administrator' : 'User'}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Active Departments:</Text>
                    <Text strong>{stats.departmentsWithUsers}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Total Team Members:</Text>
                    <Text strong>{stats.totalUsers}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default Departments;
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Row, Col, Typography, Alert,
  Space, Tag, Statistic
} from 'antd';
import { 
  TeamOutlined, UserOutlined, CrownOutlined,
  ArrowRightOutlined, CalendarOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

const { Title, Text } = Typography;

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [userCounts, setUserCounts] = useState({});
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchDepartments();
    fetchUserCounts();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        setCurrentUserRole(profile.role);
      }
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (!error) {
      setDepartments(data || []);
    }
  };

  const fetchUserCounts = async () => {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('department_id');

    if (!error) {
      const counts = {};
      
      users.forEach(user => {
        if (user.department_id) {
          counts[user.department_id] = (counts[user.department_id] || 0) + 1;
        }
      });
      
      setUserCounts(counts);
    }
  };

  const getStats = () => {
    const totalDepartments = departments.length;
    const totalUsers = userCounts ? Object.values(userCounts).reduce((sum, count) => sum + count, 0) : 0;
    const departmentsWithUsers = userCounts ? Object.keys(userCounts).length : 0;

    return { totalDepartments, totalUsers, departmentsWithUsers };
  };

  const handleDepartmentClick = (departmentName) => {
    // Navigate to the corresponding page based on department name
    switch(departmentName) {
      case 'BDM':
        navigate('/departments/bdm');
        break;
      case 'Sales Operations':
        navigate('/departments/sales-operations');
        break;
      case 'SCMT - Customer Care':
        navigate('/departments/scmt');
        break;
      default:
        console.warn('Unknown department:', departmentName);
    }
  };

  const stats = getStats();
  const isAdmin = currentUserRole === 'admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>
          <TeamOutlined /> Department Management
        </Title>
        {!isAdmin && (
          <Tag icon={<CrownOutlined />} color="red">
            Admin Access Required for Management
          </Tag>
        )}
      </div>

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
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Departments"
              value={stats.totalDepartments}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Departments"
              value={stats.departmentsWithUsers}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Department Buttons */}
      <Card title="Departments" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              size="large"
              block
              style={{ 
                height: '80px', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onClick={() => handleDepartmentClick('BDM')}
              icon={<ArrowRightOutlined />}
            >
              BDM
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              size="large"
              block
              style={{ 
                height: '80px', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onClick={() => handleDepartmentClick('Sales Operations')}
              icon={<ArrowRightOutlined />}
            >
              Sales Operations
            </Button>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              size="large"
              block
              style={{ 
                height: '80px', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}
              onClick={() => handleDepartmentClick('SCMT - Customer Care')}
              icon={<ArrowRightOutlined />}
            >
              SCMT - Customer Care
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Department Information */}
      <Card title="Department Information">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Alert
              message="Department Access"
              description="Click on any department button above to navigate to its dedicated page where you can manage tasks, meetings, and other department-specific activities."
              type="info"
              showIcon
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Departments;
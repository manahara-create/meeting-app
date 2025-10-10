import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select,
  message, Space, Tag, Popconfirm, Row, Col,
  Card, Statistic, Alert, Typography
} from 'antd';
import { 
  UserOutlined, TeamOutlined, EditOutlined, 
  DeleteOutlined, PlusOutlined, SearchOutlined, MailOutlined,
  CrownOutlined, BarChartOutlined, UsergroupAddOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activeChart, setActiveChart] = useState('pie'); // 'pie' or 'bar'

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterUsers();
    prepareChartData();
  }, [users, searchText, roleFilter, departmentFilter]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        departments(name)
      `)
      .order('created_at', { ascending: false });

    if (!error) {
      setUsers(data || []);
    } else {
      message.error('Error fetching users: ' + error.message);
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

  const prepareChartData = () => {
    // Role distribution chart data
    const roleCounts = {};
    const departmentRoleCounts = {};

    users.forEach(user => {
      // Count roles
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;

      // Count roles per department
      const deptName = user.departments?.name || 'No Department';
      if (!departmentRoleCounts[deptName]) {
        departmentRoleCounts[deptName] = { department_head: 0, User: 0, admin: 0 };
      }
      departmentRoleCounts[deptName][user.role] = (departmentRoleCounts[deptName][user.role] || 0) + 1;
    });

    // Prepare pie chart data
    const pieData = Object.keys(roleCounts).map(role => ({
      name: ROLE_LABELS[role] || role,
      value: roleCounts[role],
      role: role
    }));

    // Prepare bar chart data
    const barData = Object.keys(departmentRoleCounts).map(deptName => ({
      name: deptName,
      ...departmentRoleCounts[deptName]
    }));

    setChartData({ pieData, barData });
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department_id === departmentFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateOrUpdate = async (values) => {
    if (currentUserRole !== 'admin') {
      message.error('Only administrators can manage users!');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: values.role,
            department_id: values.department_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        message.success('User updated successfully!');
      }

      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    if (currentUserRole !== 'admin') {
      message.error('Only administrators can edit users!');
      return;
    }
    setEditingUser(user);
    form.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department_id: user.department_id
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (userId) => {
    if (currentUserRole !== 'admin') {
      message.error('Only administrators can delete users!');
      return;
    }

    try {
      // Don't allow users to delete themselves
      if (userId === currentUser?.id) {
        message.error('You cannot delete your own account!');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      message.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      message.error(error.message);
    }
  };

  const getStats = () => {
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const departmentHeadUsers = users.filter(user => user.role === 'department_head').length;
    const minorStaffUsers = users.filter(user => user.role === 'User').length;
    const usersWithDepartment = users.filter(user => user.department_id).length;

    return { totalUsers, adminUsers, departmentHeadUsers, minorStaffUsers, usersWithDepartment };
  };

  const stats = getStats();

  const isAdmin = currentUserRole === 'admin';

  const getUserRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <CrownOutlined />;
      case 'department_head': return <CrownOutlined />;
      case 'User': return <UsergroupAddOutlined />;
      default: return <UserOutlined />;
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name, record) => (
        <Space>
          {getUserRoleIcon(record.role)}
          <div>
            <div style={{ fontWeight: 'bold' }}>{name || 'No Name'}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'departments',
      key: 'department',
      render: (department) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {department?.name || 'No Department'}
        </Tag>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag 
          icon={getUserRoleIcon(role)} 
          color={ROLE_COLORS[role] || 'default'}
        >
          {ROLE_LABELS[role] || role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Joined Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            disabled={!isAdmin || record.id === currentUser?.id}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={!isAdmin || record.id === currentUser?.id}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              size="small"
              disabled={!isAdmin || record.id === currentUser?.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderChart = () => {
    if (users.length === 0) {
      return (
        <Alert
          message="No Data Available"
          description="There are no users in the system yet."
          type="info"
          showIcon
          style={{ textAlign: 'center', margin: 20 }}
        />
      );
    }

    if (activeChart === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="admin" name="Admins" fill="#ff4d4f" />
            <Bar dataKey="department_head" name="Department Heads" fill="#FFD700" />
            <Bar dataKey="User" name="User" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>
          <UserOutlined /> User Management
        </Title>
        {isAdmin ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            New User
          </Button>
        ) : (
          <Tag icon={<CrownOutlined />} color="red">
            Admin Access Required
          </Tag>
        )}
      </div>

      {!isAdmin && (
        <Alert
          message="View Only Mode"
          description="You are viewing users in read-only mode. Only administrators can create, edit, or delete users."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Admins"
              value={stats.adminUsers}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Department Heads"
              value={stats.departmentHeadUsers}
              valueStyle={{ color: '#FFD700' }}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="User"
              value={stats.minorStaffUsers}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* User Distribution Chart */}
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            User Distribution
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button 
              type={activeChart === 'pie' ? 'primary' : 'default'}
              onClick={() => setActiveChart('pie')}
              size="small"
            >
              Role Distribution
            </Button>
            <Button 
              type={activeChart === 'bar' ? 'primary' : 'default'}
              onClick={() => setActiveChart('bar')}
              size="small"
            >
              Department Breakdown
            </Button>
          </Space>
        }
      >
        {renderChart()}
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Search
              placeholder="Search users..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={filterUsers}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by role"
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
            >
              <Option value="all">All Roles</Option>
              <Option value="admin">Admin</Option>
              <Option value="department_head">Department Head</Option>
              <Option value="User">User</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by department"
              style={{ width: '100%' }}
              value={departmentFilter}
              onChange={setDepartmentFilter}
              allowClear
            >
              <Option value="all">All Departments</Option>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Button 
              onClick={() => {
                setSearchText('');
                setRoleFilter('all');
                setDepartmentFilter('all');
              }}
              block
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />

      {/* User Modal - Only visible to admins */}
      {isAdmin && (
        <Modal
          title={editingUser ? 'Edit User' : 'Create User'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingUser(null);
            form.resetFields();
          }}
          footer={null}
          width={500}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateOrUpdate}
          >
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input full name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Full Name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input prefix={<MailOutlined />} placeholder="Email" disabled />
            </Form.Item>

            <Form.Item
              name="department_id"
              label="Department"
              rules={[{ required: true, message: 'Please select department!' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role!' }]}
            >
              <Select placeholder="Select role">
                <Option value="admin">
                  <Space>
                    <CrownOutlined />
                    Admin
                  </Space>
                </Option>
                <Option value="department_head">
                  <Space>
                    <CrownOutlined />
                    Department Head
                  </Space>
                </Option>
                <Option value="User">
                  <Space>
                    <UsergroupAddOutlined />
                    User
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingUser ? 'Update' : 'Create'} User
                </Button>
                <Button onClick={() => {
                  setIsModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Users;
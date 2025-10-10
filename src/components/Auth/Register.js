import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (!error) {
      setDepartments(data || []);
    } else {
      console.error('Error fetching departments:', error);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      console.log('Registration values:', values);
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
            department_id: values.department_id
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      console.log('Auth data:', authData);

      // If user is created successfully, create profile manually
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: values.email,
              full_name: values.full_name,
              role: values.role,
              department_id: values.department_id
            },
          ]);

        if (profileError) {
          console.error('Profile error:', profileError);
          
          // If profile creation fails, try to update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: values.full_name,
              role: values.role,
              department_id: values.department_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
        }
      }

      message.success('Registration successful! Please check your email for verification.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate department selection
  const validateDepartment = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please select your department!'));
    }
    return Promise.resolve();
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundImage: `
        linear-gradient(135deg, rgba(102,126,234,0.7) 0%, rgba(118,75,162,0.7) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Card style={{ width: 480, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Meeting App</Title>
          <Text type="secondary">Create your account</Text>
        </div>
        
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            role: 'User' // Using the second code's default role
          }}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ 
              required: true, 
              message: 'Please input your full name!' 
            }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Full Name" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { 
                required: true, 
                message: 'Please input your email!' 
              },
              { 
                type: 'email', 
                message: 'Please enter a valid email!' 
              }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="department_id"
            label="Department"
            rules={[{ 
              validator: validateDepartment 
            }]}
          >
            <Select 
              placeholder="Select department" 
              size="large"
              suffixIcon={<TeamOutlined />}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
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
            rules={[{ 
              required: true, 
              message: 'Please select your role!' 
            }]}
          >
            <Select placeholder="Select role" size="large">
              {/* Using the second code's role options */}
              <Option value="slt_member">
                <UserOutlined /> SLT Member
              </Option>
              <Option value="sbu_head">
                <UserOutlined /> SBU Head
              </Option>
              <Option value="operational_manager">
                <UserOutlined /> Operational Manager
              </Option>
              <Option value="functional_manager">
                <UserOutlined /> Functional Manager
              </Option>
              <Option value="secretary">
                <UserOutlined /> Secretary
              </Option>
              <Option value="user">
                <UserOutlined /> User
              </Option>
              <Option value="admin">
                <UserOutlined /> Admin (System Administrators)
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { 
                required: true, 
                message: 'Please input your password!' 
              },
              { 
                min: 6, 
                message: 'Password must be at least 6 characters!' 
              }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { 
                required: true, 
                message: 'Please confirm your password!' 
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block 
              size="large"
            >
              Register
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
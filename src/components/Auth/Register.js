import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Select, Divider, Image, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TeamOutlined, SafetyOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching departments:', error);
        message.warning('Departments loading slowly. You can still register.');
      } else {
        setDepartments(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Enhanced email validation function
  const validateEmail = (email) => {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@(aipl|biomedica)\.[a-z]{2,}$/i;
    const isValid = emailRegex.test(email.trim().toLowerCase());
    
    if (!isValid) {
      setEmailError('Only @aipl or @biomedica company emails are allowed for registration.');
    } else {
      setEmailError('');
    }
    
    return isValid;
  };

  // Password validation function
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Email domain validator for Antd Form
  const emailValidator = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Please input your email address!'));
    }
    
    if (!validateEmail(value)) {
      return Promise.reject(new Error('Only @aipl or @biomedica company emails are allowed!'));
    }
    
    return Promise.resolve();
  };

  // Registration handler
  const onFinish = async (values) => {
    setLoading(true);
    setEmailError('');

    try {
      console.log('Registration values:', values);

      // Final email validation check
      if (!validateEmail(values.email)) {
        message.error('Invalid email: Only @aipl or @biomedica company emails are allowed.');
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(values.password);
      if (passwordError) {
        message.error(passwordError);
        setLoading(false);
        return;
      }

      // Normalize email to lowercase
      const normalizedEmail = values.email.trim().toLowerCase();

      // --- Supabase Auth Sign-Up ---
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: 'User',
            department_id: values.department_id,
          },
        },
      });

      // --- Handle Auth Errors ---
      if (authError) {
        console.error('Auth error details:', authError);

        let msg = '';
        const errorText = authError.message?.toLowerCase() || '';

        if (errorText.includes('user already registered')) {
          msg = 'This email is already registered. Please log in or use another email.';
        } else if (errorText.includes('email not allowed')) {
          msg = 'This email domain is not allowed for registration.';
        } else if (errorText.includes('invalid email')) {
          msg = 'Please enter a valid email address.';
        } else if (errorText.includes('password should be at least')) {
          msg = 'Password does not meet security requirements.';
        } else if (errorText.includes('confirmation email')) {
          msg = 'Email service unavailable. Account created but verification email failed. Please try logging in.';
          message.warning(msg);

          // Continue to profile creation
          if (authData?.user) {
            await createUserProfile(authData.user, values);
          }
          alert("✅ Boom! You’re almost there — open your email and hit ‘Confirm’ to activate your account!");
          navigate('/login');
          return;
        } else {
          msg = authError.message || 'Unknown error during registration.';
        }

        throw new Error(msg);
      }

      console.log('Auth data received:', authData);

      // --- Create User Profile ---
      if (authData.user) {
        await createUserProfile(authData.user, values);
      }

      // --- Success Messages ---
      if (authData.user && !authData.user.email_confirmed_at) {
        message.success(
          <span>
            Account created successfully! 🎉<br />
            {authData.user.identities && authData.user.identities.length > 0
              ? 'Check your email for the verification link.'
              : 'You can now try logging in.'}
          </span>,
          8
        );
      } else {
        message.success('Account created successfully! You can now log in.', 5);
      }

      // --- Redirect ---
      setTimeout(() => navigate('/login'), 3000);

    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      setEmailError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Separate function for profile creation
  const createUserProfile = async (user, values) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: values.email.trim().toLowerCase(),
            full_name: values.full_name,
            role:  'User',
            department_id: values.department_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ]);

      if (profileError) {
        alert('Profile creation error:', profileError);

        // If profile creation fails, try to update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: 'User',
            department_id: values.department_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Profile update also failed:', updateError);
          // Don't throw error here as auth user was created successfully
          message.warning('Account created but profile setup incomplete. Please contact support.');
        }
      }
    } catch (profileError) {
      console.error('Unexpected error in profile creation:', profileError);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Form validation failed:', errorInfo);
    message.warning('Please fill in all required fields correctly.');
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    setEmailError('');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay',
      padding: '20px'
    }}>
      <Card
        style={{
          width: 520,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          borderRadius: '16px',
          border: 'none',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* Application Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            marginBottom: 20,
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Image
              src="/images/main-app-logo.png"
              alt="Schedify"
              preview={false}
              style={{
                height: '80px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          <Text style={{
            fontSize: '16px',
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Create Your Account
          </Text>
        </div>

        {/* Email Domain Restriction Alert */}
        <Alert
          message="Domain Restriction"
          description="Only @aipl or @biomedica company emails are allowed for registration."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
          closable
        />

        {/* Email Error Alert */}
        {emailError && (
          <Alert
            message="Registration Error"
            description={emailError}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
          />
        )}

        {/* AIPL Logo Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: 28,
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #e74c3c'
        }}>
          <Text strong style={{
            display: 'block',
            marginBottom: 8,
            fontSize: '14px',
            color: '#2c3e50'
          }}>
            Schedule Application For
          </Text>
          <Image
            src="/images/aipl.png"
            alt="AIPL"
            preview={false}
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        <Divider style={{
          margin: '24px 0',
          borderColor: '#bdc3c7',
          color: '#34495e',
          fontSize: '15px',
          fontWeight: '600'
        }}>
          <IdcardOutlined /> Registration Details
        </Divider>

        {/* Registration Form */}
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            role: 'User'
          }}
        >
          <Form.Item
            name="full_name"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Full Name</Text>}
            rules={[{
              required: true,
              message: 'Please input your full name!'
            }]}
            hasFeedback
          >
            <Input
              prefix={<UserOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter your full name"
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Email Address</Text>}
            rules={[
              {
                required: true,
                validator: emailValidator
              }
            ]}
            hasFeedback
          >
            <Input
              prefix={<MailOutlined style={{ color: '#3498db' }} />}
              placeholder="Enter Your Email Address"
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              name="department_id"
              label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Department</Text>}
              rules={[{
                required: true,
                message: 'Please select your department!'
              }]}
            >
              <Select
                placeholder="Select department"
                size="large"
                suffixIcon={<TeamOutlined style={{ color: '#3498db' }} />}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                style={{
                  borderRadius: '8px'
                }}
                notFoundContent={
                  <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                    No departments loaded
                  </div>
                }
              >
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="password"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Password</Text>}
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
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#3498db' }} />}
              placeholder="Create a strong password"
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>Confirm Password</Text>}
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
            hasFeedback
          >
            <Input.Password
              prefix={<SafetyOutlined style={{ color: '#3498db' }} />}
              placeholder="Confirm your password"
              size="large"
              style={{
                height: '48px',
                fontSize: '15px',
                borderRadius: '8px',
                border: '2px solid #dcdfe6',
                padding: '0 16px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                icon={<UserOutlined />}
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
                }}
              >
                Create Account
              </Button>
              <Button
                onClick={handleReset}
                block
                size="large"
                style={{
                  height: '50px',
                  fontSize: '16px',
                  fontWeight: '500',
                  background: '#ecf0f1',
                  border: '2px solid #bdc3c7',
                  color: '#2c3e50',
                  borderRadius: '10px'
                }}
              >
                Clear Form
              </Button>
            </div>
          </Form.Item>
        </Form>

        {/* Additional Links */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Text style={{
            fontSize: '14px',
            color: '#7f8c8d',
            fontWeight: '500'
          }}>
            Already have an account?{' '}
          </Text>
          <Link
            to="/login"
            style={{
              fontSize: '14px',
              color: '#3498db',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            Sign in here
          </Link>
        </div>

        {/* Footer with eHealth Logo */}
        <Divider style={{
          margin: '24px 0',
          borderColor: '#bdc3c7'
        }} />
        <div style={{
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '2px solid #3498db'
        }}>
          <Text style={{
            display: 'block',
            marginBottom: 8,
            fontSize: '12px',
            color: '#7f8c8d',
            fontWeight: '600'
          }}>
            Powered by
          </Text>
          <Image
            src="/images/eHealth.png"
            alt="eHealth"
            preview={false}
            style={{
              height: '35px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default Register;
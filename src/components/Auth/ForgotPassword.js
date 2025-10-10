import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      message.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundImage: `
      linear-gradient(135deg, rgba(102,126,234,0.7) 0%, rgba(118,75,162,0.7) 100%),
      url('/images/image2.avif')
    `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
        <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>Check Your Email</Title>
            <Text type="secondary">
              We've sent a password reset link to your email address. 
              Please check your inbox and follow the instructions.
            </Text>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
      <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundImage: `
      linear-gradient(135deg, rgba(102,126,234,0.7) 0%, rgba(162, 75, 75, 0.7) 100%),
      url('/images/image2.avif')
    `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Forgot Password</Title>
          <Text type="secondary">Enter your email to reset your password</Text>
        </div>
        
        <Form
          name="forgotPassword"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
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
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <ArrowLeftOutlined /> Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
import React from 'react';
import { Button, Card, Typography, Image, Divider } from 'antd';
import { CheckCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ResetPasswordSuccess = () => {
  const navigate = useNavigate();

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
        </div>

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
          Password Reset Complete
        </Divider>

        {/* Success Content */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: '64px',
            color: '#27ae60',
            marginBottom: 24
          }}>
            <CheckCircleOutlined />
          </div>
          
          <Title level={3} style={{ 
            color: '#27ae60',
            marginBottom: 16
          }}>
            Success!
          </Title>
          
          <Text style={{ 
            fontSize: '16px',
            color: '#2c3e50',
            lineHeight: '1.6',
            display: 'block',
            marginBottom: 8
          }}>
            Your password has been successfully reset.
          </Text>
          
          <Text style={{ 
            fontSize: '15px',
            color: '#7f8c8d',
            lineHeight: '1.5'
          }}>
            You can now log in to your account using your new password.
          </Text>
        </div>

        {/* Action Button */}
        <div style={{ marginBottom: 32 }}>
          <Button
            type="primary"
            onClick={() => navigate('/login')}
            block
            size="large"
            icon={<LoginOutlined />}
            style={{
              height: '50px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              border: 'none',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
            }}
          >
            Continue to Login
          </Button>
        </div>

        {/* Additional Help */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <Text style={{ 
            fontSize: '14px',
            color: '#6c757d'
          }}>
            Having trouble?{' '}
            <Button 
              type="link" 
              style={{ 
                padding: 0, 
                height: 'auto',
                fontWeight: '600'
              }}
              onClick={() => navigate('/forgot-password')}
            >
              Request another reset link
            </Button>
          </Text>
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

export default ResetPasswordSuccess;
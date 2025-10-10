import React from 'react';
import { Result, Button, Card } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ResetPasswordSuccess = () => {
  const navigate = useNavigate();

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
      <Card style={{ width: 500, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Password Reset Successful!"
          subTitle="Your password has been successfully reset. You can now login with your new password."
          extra={[
            <Button type="primary" key="login" onClick={() => navigate('/login')}>
              Go to Login
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default ResetPasswordSuccess;
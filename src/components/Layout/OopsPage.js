import React from 'react';
import {
    Card,
    Row,
    Col,
    Typography,
    Space,
    Button,
    Timeline,
    Progress,
    Alert,
    Statistic,
    Divider,
    Tag
} from 'antd';
import {
    TeamOutlined,
    ToolOutlined,
    RocketOutlined,
    ClockCircleOutlined,
    BugOutlined,
    CodeOutlined,
    DeploymentUnitOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined,
    CalendarOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const OopsPage = () => {
    // Mock progress for different sections
    const developmentProgress = [
        { feature: 'Department', progress: 90, status: 'active' },
        { feature: 'User Management', progress: 85, status: 'active' },
        { feature: 'Analytics Dashboard', progress: 60, status: 'active' },
        { feature: 'Reporting System', progress: 30, status: 'active' },
        { feature: 'Mobile App', progress: 15, status: 'exception' },
    ];

    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 7); // 7 days from now

    return (
        <div style={{ 
            padding: '24px', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <Card 
                    style={{ 
                        marginBottom: '24px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '16px'
                    }}
                    bodyStyle={{ padding: '32px' }}
                >
                    <Row gutter={[32, 32]} align="middle">
                        <Col xs={24} md={12}>
                            <Space direction="vertical" size="large">
                                <div>
                                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>
                                        <DeploymentUnitOutlined /> System Under Development
                                    </Tag>
                                    <Title level={1} style={{ margin: '16px 0 8px 0', color: '#1890ff' }}>
                                        <ToolOutlined /> Oops! Working on it...
                                    </Title>
                                    <Title level={4} style={{ margin: 0, color: '#666', fontWeight: 'normal' }}>
                                        The  System is currently being enhanced with new features. 
                                        We're working quickly to bring you an improved experience.
                                    </Title>
                                </div>
                                
                                <Space size="middle">
                                    <Button type="primary" size="large" icon={<RocketOutlined />}>
                                        View Progress
                                    </Button>
                                    <Button size="large" icon={<ClockCircleOutlined />}>
                                        Check Back Later
                                    </Button>
                                </Space>
                            </Space>
                        </Col>
                        
                        <Col xs={24} md={12}>
                            <Row gutter={[16, 16]}>
                                <Col xs={12}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#f0f8ff' }}>
                                        <Statistic
                                            title="Overall Progress"
                                            value={65}
                                            suffix="%"
                                            valueStyle={{ color: '#1890ff' }}
                                            prefix={<ThunderboltOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                                        <Statistic
                                            title="Days Remaining"
                                            value={7}
                                            suffix="days"
                                            valueStyle={{ color: '#52c41a' }}
                                            prefix={<CalendarOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                                        <Statistic
                                            title="Features Completed"
                                            value={12}
                                            valueStyle={{ color: '#fa8c16' }}
                                            prefix={<SafetyCertificateOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={12}>
                                    <Card size="small" style={{ textAlign: 'center', background: '#fff0f6' }}>
                                        <Statistic
                                            title="Active Developers"
                                            value={2}
                                            valueStyle={{ color: '#eb2f96' }}
                                            prefix={<TeamOutlined />}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>

                {/* Progress Section */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <CodeOutlined />
                                    Development Progress
                                    <Tag color="blue">Live Updates</Tag>
                                </Space>
                            }
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '100%'
                            }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {developmentProgress.map((item, index) => (
                                    <div key={index}>
                                        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <Text strong>{item.feature}</Text>
                                            <Text type="secondary">{item.progress}%</Text>
                                        </Space>
                                        <Progress 
                                            percent={item.progress} 
                                            status={item.status}
                                            strokeColor={
                                                item.progress === 100 ? '#52c41a' :
                                                item.progress >= 70 ? '#1890ff' :
                                                item.progress >= 40 ? '#faad14' : '#ff4d4f'
                                            }
                                        />
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Space>
                                    <ClockCircleOutlined />
                                    Development Timeline
                                    <Tag color="green">Active</Tag>
                                </Space>
                            }
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                borderRadius: '12px',
                                height: '100%'
                            }}
                        >
                            <Timeline>
                                <Timeline.Item 
                                    color="green"
                                    dot={<SafetyCertificateOutlined style={{ fontSize: '16px' }} />}
                                >
                                    <Text strong> Department Module</Text>
                                    <br />
                                    <Text type="secondary">Completed and Live</Text>
                                    <Tag color="success" style={{ marginLeft: '8px' }}>90%</Tag>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color="blue"
                                    dot={<TeamOutlined style={{ fontSize: '16px' }} />}
                                >
                                    <Text strong>User Management System</Text>
                                    <br />
                                    <Text type="secondary">Final testing phase</Text>
                                    <Tag color="processing" style={{ marginLeft: '8px' }}>85%</Tag>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color="blue"
                                    dot={<DeploymentUnitOutlined style={{ fontSize: '16px' }} />}
                                >
                                    <Text strong>Analytics Dashboard</Text>
                                    <br />
                                    <Text type="secondary">Development in progress</Text>
                                    <Tag color="processing" style={{ marginLeft: '8px' }}>60%</Tag>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color="orange"
                                    dot={<BugOutlined style={{ fontSize: '16px' }} />}
                                >
                                    <Text strong>Reporting System</Text>
                                    <br />
                                    <Text type="secondary">Initial development phase</Text>
                                    <Tag color="warning" style={{ marginLeft: '8px' }}>30%</Tag>
                                </Timeline.Item>
                                <Timeline.Item 
                                    color="red"
                                    dot={<ToolOutlined style={{ fontSize: '16px' }} />}
                                >
                                    <Text strong>Mobile Application</Text>
                                    <br />
                                    <Text type="secondary">Planning and design</Text>
                                    <Tag color="error" style={{ marginLeft: '8px' }}>15%</Tag>
                                </Timeline.Item>
                            </Timeline>
                        </Card>
                    </Col>
                </Row>

                {/* Information Cards */}
                <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                    <Col xs={24} md={8}>
                        <Card 
                            size="small"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                borderRadius: '12px',
                                textAlign: 'center',
                                height: '100%'
                            }}
                        >
                            <TeamOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                            <Title level={4}> Team Working</Title>
                            <Paragraph type="secondary">
                                Our development team is actively working on new features and improvements for the  system.
                            </Paragraph>
                        </Card>
                    </Col>
                    
                    <Col xs={24} md={8}>
                        <Card 
                            size="small"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                borderRadius: '12px',
                                textAlign: 'center',
                                height: '100%'
                            }}
                        >
                            <RocketOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                            <Title level={4}>Quick Updates</Title>
                            <Paragraph type="secondary">
                                We're deploying updates regularly. The system will be back better than ever!
                            </Paragraph>
                        </Card>
                    </Col>
                    
                    <Col xs={24} md={8}>
                        <Card 
                            size="small"
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: 'none',
                                borderRadius: '12px',
                                textAlign: 'center',
                                height: '100%'
                            }}
                        >
                            <ClockCircleOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
                            <Title level={4}>Estimated Completion</Title>
                            <Paragraph type="secondary">
                                Target completion: {estimatedCompletion.toLocaleDateString()}
                            </Paragraph>
                        </Card>
                    </Col>
                </Row>

                {/* Alert Message */}
                <Alert
                    message="Development in Progress"
                    description={
                        <Space direction="vertical">
                            <Text>
                                The  system is currently undergoing scheduled development and maintenance. 
                                We apologize for any inconvenience and appreciate your patience.
                            </Text>
                            <Text strong>
                                Expected completion: {estimatedCompletion.toLocaleDateString()} • Current progress: 65%
                            </Text>
                        </Space>
                    }
                    type="info"
                    showIcon
                    style={{ 
                        marginTop: '24px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '12px'
                    }}
                    action={
                        <Space>
                            <Button size="small" type="primary">
                                View Details
                            </Button>
                            <Button size="small">
                                Contact Support
                            </Button>
                        </Space>
                    }
                />

                {/* Footer */}
                <Divider />
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <Space direction="vertical" size="small">
                        <Text type="secondary">
                             Department System • Under Active Development
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Last updated: {new Date().toLocaleString()} • Version 2.1.0
                        </Text>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default OopsPage;
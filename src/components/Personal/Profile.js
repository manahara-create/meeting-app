import React, { useState, useEffect, useCallback } from 'react';
import {
    Row, Col, Card, Form, Input, Button, Tabs, Table, Modal,
    Space, Tag, DatePicker, Select, Typography, Avatar, Divider,
    Popconfirm, Statistic, Alert, Spin, Empty, Result, Descriptions,
    Switch, Progress, Badge, Tooltip, List
} from 'antd';
import {
    UserOutlined, EditOutlined, SaveOutlined, CloseOutlined,
    PlusOutlined, DeleteOutlined, CalendarOutlined, TeamOutlined,
    ClockCircleOutlined, SyncOutlined, ExclamationCircleOutlined,
    CheckCircleOutlined, WarningOutlined, InfoCircleOutlined,
    ReloadOutlined, EyeOutlined, WechatOutlined, MessageOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Extend dayjs with required plugins
try {
    dayjs.extend(isBetween);
    dayjs.extend(isSameOrBefore);
    dayjs.extend(isSameOrAfter);
} catch (error) {
    console.error('Error extending Day.js plugins:', error);
}

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
    <Result
        status="error"
        title="Something went wrong in Profile Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading profile data..." }) => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip={tip} />
    </div>
);

// Statistics Cards Component
const ProfileStatistics = ({ stats, loading = false }) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Total Meetings"
                    value={stats?.totalMeetings || 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Upcoming"
                    value={stats?.upcomingMeetings || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Ongoing"
                    value={stats?.ongoingMeetings || 0}
                    prefix={<SyncOutlined spin />}
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Completion Rate"
                    value={stats?.completionRate || 0}
                    suffix="%"
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                />
            </Card>
        </Col>
    </Row>
);

const Profile = () => {
    // Error handling states
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Auto-refresh states
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form] = Form.useForm();
    
    // Schedule states
    const [personalMeetings, setPersonalMeetings] = useState([]);
    const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [meetingForm] = Form.useForm();
    const [meetingsLoading, setMeetingsLoading] = useState(false);

    // Departments list for dropdown
    const [departments, setDepartments] = useState([]);

    // Safe date parsing function
    const safeDayjs = useCallback((date, format = null) => {
        try {
            if (!date) {
                return dayjs();
            }

            if (dayjs.isDayjs(date)) {
                return date;
            }

            if (typeof date === 'string' || typeof date === 'number') {
                const parsedDate = format ? dayjs(date, format) : dayjs(date);

                if (!parsedDate.isValid()) {
                    console.warn('Invalid date provided:', date);
                    return dayjs();
                }

                return parsedDate;
            }

            console.warn('Unsupported date type:', typeof date, date);
            return dayjs();
        } catch (error) {
            console.error('Error parsing date:', date, error);
            return dayjs();
        }
    }, []);

    // Error handler
    const handleError = useCallback((error, context = 'Unknown operation') => {
        console.error(`Error in ${context}:`, error);

        const errorMessage = error?.message || 'An unexpected error occurred';

        toast.error(`Error in ${context}: ${errorMessage}`);

        setError({
            message: errorMessage,
            context,
            timestamp: new Date().toISOString()
        });

        return error;
    }, []);

    // Safe state update wrapper
    const safeSetState = useCallback((setter, value) => {
        try {
            setter(value);
        } catch (err) {
            handleError(err, 'state update');
        }
    }, [handleError]);

    // Reset error boundary
    const resetErrorBoundary = useCallback(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
        initializeProfile();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshProfileData();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshProfileData = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchPersonalMeetings()
            ]);
            safeSetState(setLastRefresh, new Date());
            toast.info('Profile data updated automatically');
        } catch (error) {
            handleError(error, 'auto-refresh');
        } finally {
            setIsRefreshing(false);
        }
    };

    const manualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchPersonalMeetings()
            ]);
            safeSetState(setLastRefresh, new Date());
            toast.success('Profile data refreshed successfully');
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
                toast.info('Auto-refresh enabled (every 2 minutes)');
            } else {
                toast.info('Auto-refresh disabled');
            }
        } catch (error) {
            handleError(error, 'toggle auto-refresh');
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

    // Initialize profile module
    const initializeProfile = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchPersonalMeetings(),
                fetchDepartments()
            ]);
        } catch (error) {
            handleError(error, 'initializing profile module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeProfile();
    }, [retryCount]);

    useEffect(() => {
        const cleanup = setupAutoRefresh();
        return cleanup;
    }, [setupAutoRefresh]);

    // Fetch departments for dropdown
    const fetchDepartments = async () => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name')
                .order('name');

            if (error) throw error;
            safeSetState(setDepartments, data || []);
        } catch (error) {
            handleError(error, 'fetching departments');
            safeSetState(setDepartments, []);
        }
    };

    // Fetch current user profile
    const fetchCurrentUser = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                throw new Error(`Authentication error: ${authError.message}`);
            }
            
            if (!user) {
                toast.warning('No user found. Please log in.');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    departments(name)
                `)
                .eq('id', user.id)
                .single();

            if (profileError) {
                if (profileError.code === 'PGRST116') {
                    // Profile not found, create one
                    await createUserProfile(user);
                    return;
                }
                throw profileError;
            }
            
            if (profile) {
                safeSetState(setCurrentUser, {
                    ...user,
                    ...profile,
                    department_name: profile.departments?.name
                });
                
                // Set form values
                form.setFieldsValue({
                    email: profile.email || user.email,
                    full_name: profile.full_name,
                    department_id: profile.department_id,
                    role: profile.role
                });
            }
        } catch (error) {
            handleError(error, 'fetching user profile');
        }
    };

    // Create user profile if not exists
    const createUserProfile = async (user) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        role: 'user',
                        created_at: new Date().toISOString(),
                    }
                ]);

            if (error) throw error;
            
            toast.success('Profile created successfully');
            fetchCurrentUser(); // Retry fetching
        } catch (error) {
            handleError(error, 'creating user profile');
        }
    };

    // Fetch personal meetings
    const fetchPersonalMeetings = async () => {
        try {
            setMeetingsLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) throw authError;
            if (!user) {
                toast.warning('Please log in to view meetings');
                return;
            }

            const { data, error } = await supabase
                .from('personal_meetings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            safeSetState(setPersonalMeetings, data || []);
        } catch (error) {
            handleError(error, 'fetching personal meetings');
        } finally {
            setMeetingsLoading(false);
        }
    };

    // Update profile
    const handleUpdateProfile = async (values) => {
        try {
            setLoading(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) throw authError;
            if (!user) throw new Error('No user found');

            const updateData = {
                full_name: values.full_name?.trim(),
                department_id: values.department_id
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully');
            safeSetState(setEditing, false);
            fetchCurrentUser(); // Refresh user data
        } catch (error) {
            handleError(error, 'updating profile');
        } finally {
            setLoading(false);
        }
    };

    // Schedule CRUD operations
    const handleCreateMeeting = async (values) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) throw authError;
            if (!user) throw new Error('No user found');

            if (!values.dateRange || values.dateRange.length !== 2) {
                throw new Error('Invalid date range selected');
            }

            const meetingData = {
                topic: values.topic?.trim(),
                description: values.description?.trim(),
                venue: values.venue?.trim(),
                user_id: user.id,
                start_date: safeDayjs(values.dateRange[0]).format('YYYY-MM-DD'),
                end_date: safeDayjs(values.dateRange[1]).format('YYYY-MM-DD'),
                created_at: new Date().toISOString()
            };

            // Validate dates
            if (safeDayjs(meetingData.start_date).isAfter(meetingData.end_date)) {
                throw new Error('Start date cannot be after end date');
            }

            const { error } = await supabase
                .from('personal_meetings')
                .insert([meetingData]);

            if (error) throw error;

            toast.success('Meeting created successfully');
            safeSetState(setIsMeetingModalVisible, false);
            meetingForm.resetFields();
            fetchPersonalMeetings();
        } catch (error) {
            handleError(error, 'creating meeting');
        }
    };

    const handleUpdateMeeting = async (values) => {
        try {
            if (!values.dateRange || values.dateRange.length !== 2) {
                throw new Error('Invalid date range selected');
            }

            const meetingData = {
                topic: values.topic?.trim(),
                description: values.description?.trim(),
                venue: values.venue?.trim(),
                start_date: safeDayjs(values.dateRange[0]).format('YYYY-MM-DD'),
                end_date: safeDayjs(values.dateRange[1]).format('YYYY-MM-DD')
            };

            // Validate dates
            if (safeDayjs(meetingData.start_date).isAfter(meetingData.end_date)) {
                throw new Error('Start date cannot be after end date');
            }

            const { error } = await supabase
                .from('personal_meetings')
                .update(meetingData)
                .eq('id', editingMeeting.id);

            if (error) throw error;

            toast.success('Meeting updated successfully');
            safeSetState(setIsMeetingModalVisible, false);
            safeSetState(setEditingMeeting, null);
            meetingForm.resetFields();
            fetchPersonalMeetings();
        } catch (error) {
            handleError(error, 'updating meeting');
        }
    };

    const handleDeleteMeeting = async (id) => {
        try {
            if (!id) throw new Error('No meeting ID provided');

            const { error } = await supabase
                .from('personal_meetings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Meeting deleted successfully');
            fetchPersonalMeetings();
        } catch (error) {
            handleError(error, 'deleting meeting');
        }
    };

    const openMeetingModal = (meeting = null) => {
        try {
            safeSetState(setEditingMeeting, meeting);
            if (meeting) {
                meetingForm.setFieldsValue({
                    ...meeting,
                    dateRange: [
                        safeDayjs(meeting.start_date),
                        safeDayjs(meeting.end_date)
                    ]
                });
            } else {
                meetingForm.resetFields();
            }
            safeSetState(setIsMeetingModalVisible, true);
        } catch (error) {
            handleError(error, 'opening meeting modal');
        }
    };

    const closeMeetingModal = () => {
        safeSetState(setIsMeetingModalVisible, false);
        safeSetState(setEditingMeeting, null);
        meetingForm.resetFields();
    };

    // Get status tag color based on dates
    const getMeetingStatus = (meeting) => {
        try {
            if (!meeting?.start_date || !meeting?.end_date) {
                return <Tag color="default">Unknown</Tag>;
            }

            const today = safeDayjs();
            const startDate = safeDayjs(meeting.start_date);
            const endDate = safeDayjs(meeting.end_date);

            if (today.isBefore(startDate)) {
                return <Tag color="blue">Upcoming</Tag>;
            } else if (today.isAfter(endDate)) {
                return <Tag color="green">Completed</Tag>;
            } else {
                return <Tag color="orange">Ongoing</Tag>;
            }
        } catch (error) {
            console.error('Error getting meeting status:', error);
            return <Tag color="default">Error</Tag>;
        }
    };

    // Table columns for personal meetings
    const meetingColumns = [
        {
            title: 'Topic',
            dataIndex: 'topic',
            key: 'topic',
            render: (text) => text || 'No Topic',
            width: 150
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (
                <Text ellipsis={{ tooltip: text }}>
                    {text || 'No Description'}
                </Text>
            ),
            width: 200
        },
        {
            title: 'Date Range',
            key: 'date_range',
            render: (record) => {
                try {
                    return (
                        <Space>
                            <Tag color="blue">
                                {safeDayjs(record.start_date).format('MMM D, YYYY')}
                            </Tag>
                            <Text>to</Text>
                            <Tag color="blue">
                                {safeDayjs(record.end_date).format('MMM D, YYYY')}
                            </Tag>
                        </Space>
                    );
                } catch (error) {
                    console.error('Error rendering date range:', error);
                    return <Text type="secondary">Invalid dates</Text>;
                }
            },
            width: 200
        },
        {
            title: 'Venue',
            dataIndex: 'venue',
            key: 'venue',
            render: (text) => text || 'Not specified',
            width: 120
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => getMeetingStatus(record),
            width: 100
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => {
                try {
                    return safeDayjs(date).format('MMM D, YYYY HH:mm');
                } catch (error) {
                    return 'Invalid date';
                }
            },
            width: 150
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit meeting">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => openMeetingModal(record)}
                            size="small"
                        >
                            Edit
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure to delete this meeting?"
                        onConfirm={() => handleDeleteMeeting(record.id)}
                        okText="Yes"
                        cancelText="No"
                        okType="danger"
                    >
                        <Tooltip title="Delete meeting">
                            <Button type="link" danger icon={<DeleteOutlined />} size="small">
                                Delete
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // Calculate meeting statistics safely
    const getMeetingStats = () => {
        try {
            const today = safeDayjs();
            const totalMeetings = personalMeetings.length;
            
            const upcomingMeetings = personalMeetings.filter(m => 
                m.start_date && today.isBefore(safeDayjs(m.start_date))
            ).length;
            
            const ongoingMeetings = personalMeetings.filter(m => 
                m.start_date && m.end_date && 
                today.isBetween(safeDayjs(m.start_date), safeDayjs(m.end_date), 'day', '[]')
            ).length;
            
            const completedMeetings = personalMeetings.filter(m => 
                m.end_date && today.isAfter(safeDayjs(m.end_date))
            ).length;

            const completionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

            return { 
                totalMeetings, 
                upcomingMeetings, 
                ongoingMeetings, 
                completedMeetings, 
                completionRate 
            };
        } catch (error) {
            console.error('Error calculating meeting stats:', error);
            return { 
                totalMeetings: 0, 
                upcomingMeetings: 0, 
                ongoingMeetings: 0, 
                completedMeetings: 0, 
                completionRate: 0 
            };
        }
    };

    const stats = getMeetingStats();

    // Render error state
    if (error && retryCount > 2) {
        return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    // Render loading state
    if (loading && !currentUser) {
        return <LoadingSpinner tip="Loading profile data..." />;
    }

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="Profile Module Error"
                    description={`${error.context}: ${error.message}`}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    action={
                        <Button size="small" type="primary" onClick={resetErrorBoundary}>
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
                            <UserOutlined /> Profile & Personal Schedule
                        </Title>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                                <ClockCircleOutlined /> Last updated: {formatTimeSinceLastRefresh()}
                            </Text>
                            <Space style={{ flexWrap: 'wrap' }}>
                                <Button
                                    icon={<SyncOutlined spin={isRefreshing} />}
                                    onClick={manualRefresh}
                                    loading={isRefreshing}
                                    size="medium"
                                >
                                    Refresh
                                </Button>
                                <Switch
                                    checkedChildren="Auto On"
                                    unCheckedChildren="Auto Off"
                                    checked={autoRefresh}
                                    onChange={handleAutoRefreshToggle}
                                />
                            </Space>
                        </Space>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Space style={{ float: 'right' }}>
                            <Badge count={stats.totalMeetings} showZero color="#1890ff">
                                <Tag color="blue" style={{ fontSize: '14px', padding: '8px 16px' }}>
                                    <CalendarOutlined /> Personal Meetings
                                </Tag>
                            </Badge>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {autoRefresh && (
                <Alert
                    message="Auto-refresh Enabled"
                    description="Profile data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            <Tabs defaultActiveKey="profile">
                {/* Profile Tab */}
                <TabPane 
                    tab={
                        <span>
                            <UserOutlined />
                            Profile Information
                            <Badge count={0} showZero style={{ marginLeft: 8 }} />
                        </span>
                    } 
                    key="profile"
                >
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={8}>
                            <Card 
                                loading={loading}
                                title="Profile Overview"
                                extra={
                                    <Tooltip title="Refresh profile">
                                        <Button 
                                            icon={<ReloadOutlined />} 
                                            onClick={fetchCurrentUser}
                                            loading={loading}
                                            size="small"
                                        />
                                    </Tooltip>
                                }
                            >
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Avatar
                                        size={100}
                                        icon={<UserOutlined />}
                                        style={{ 
                                            backgroundColor: '#1890ff',
                                            marginBottom: 16,
                                            border: '4px solid #e6f7ff'
                                        }}
                                    />
                                    <Title level={3} style={{ marginBottom: 8 }}>
                                        {currentUser?.full_name || 'No Name'}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: '16px' }}>
                                        {currentUser?.email}
                                    </Text>
                                    <Divider />
                                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Role">
                                                <Tag color="blue" style={{ margin: 0 }}>
                                                    {currentUser?.role || 'user'}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Department">
                                                <Text strong>{currentUser?.department_name || 'Not assigned'}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Member Since">
                                                <Text>
                                                    {currentUser?.created_at ? 
                                                        safeDayjs(currentUser.created_at).format('MMM D, YYYY') : 
                                                        'N/A'
                                                    }
                                                </Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Last Login">
                                                <Text>
                                                    {currentUser?.last_sign_in_at ? 
                                                        safeDayjs(currentUser.last_sign_in_at).format('MMM D, YYYY HH:mm') : 
                                                        'N/A'
                                                    }
                                                </Text>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </Space>
                                </div>
                            </Card>

                            {/* Quick Stats Card */}
                            <Card 
                                title="Meeting Overview" 
                                style={{ marginTop: 24 }}
                                size="small"
                            >
                                <ProfileStatistics stats={stats} loading={meetingsLoading} />
                                
                                {/* Progress Bar */}
                                <div style={{ marginTop: 16 }}>
                                    <Text strong>Schedule Completion Progress</Text>
                                    <Progress 
                                        percent={stats.completionRate} 
                                        status={stats.completionRate >= 80 ? "success" : "active"}
                                        strokeColor={{
                                            '0%': '#108ee9',
                                            '100%': '#87d068',
                                        }}
                                        style={{ marginTop: 8 }}
                                    />
                                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                        {stats.completedMeetings} of {stats.totalMeetings} meetings completed
                                    </Text>
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={16}>
                            <Card
                                title="Edit Profile Information"
                                loading={loading}
                                extra={
                                    !editing ? (
                                        <Button
                                            icon={<EditOutlined />}
                                            onClick={() => setEditing(true)}
                                            type="primary"
                                        >
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <Space>
                                            <Button
                                                icon={<CloseOutlined />}
                                                onClick={() => {
                                                    setEditing(false);
                                                    form.resetFields();
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined />}
                                                loading={loading}
                                                onClick={() => form.submit()}
                                            >
                                                Save Changes
                                            </Button>
                                        </Space>
                                    )
                                }
                            >
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleUpdateProfile}
                                    disabled={!editing}
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Full Name"
                                                name="full_name"
                                                rules={[
                                                    { required: true, message: 'Please enter your full name' },
                                                    { min: 2, message: 'Name must be at least 2 characters' },
                                                    { max: 100, message: 'Name cannot exceed 100 characters' }
                                                ]}
                                            >
                                                <Input 
                                                    prefix={<UserOutlined />} 
                                                    placeholder="Enter your full name" 
                                                    maxLength={100}
                                                    showCount
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Email Address"
                                                name="email"
                                            >
                                                <Input 
                                                    disabled 
                                                    placeholder="Email" 
                                                    prefix={<UserOutlined />}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Role"
                                                name="role"
                                            >
                                                <Input 
                                                    disabled 
                                                    placeholder="Role" 
                                                prefix={<TeamOutlined />}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Department"
                                                name="department_id"
                                            >
                                                <Select 
                                                    placeholder="Select department" 
                                                    disabled={!editing}
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
                                        </Col>
                                    </Row>

                                    {editing && (
                                        <Alert
                                            message="Profile Update Information"
                                            description={
                                                <div>
                                                    <Text>
                                                        <strong>Note:</strong> You cannot change your role or email address directly. 
                                                        Contact your administrator for role changes or email updates.
                                                    </Text>
                                                    <br />
                                                    <Text>
                                                        Department changes may require approval depending on your organization's policies.
                                                    </Text>
                                                </div>
                                            }
                                            type="info"
                                            showIcon
                                            style={{ marginTop: 16 }}
                                        />
                                    )}
                                </Form>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                {/* Schedule Tab */}
                <TabPane 
                    tab={
                        <span>
                            <CalendarOutlined />
                            Personal Schedule
                            <Badge count={stats.totalMeetings} showZero style={{ marginLeft: 8 }} />
                        </span>
                    } 
                    key="schedule"
                >
                    <Card
                        title="Personal Meetings & Schedule Management"
                        extra={
                            <Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchPersonalMeetings}
                                    loading={meetingsLoading}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => openMeetingModal()}
                                    loading={meetingsLoading}
                                >
                                    Add New Meeting
                                </Button>
                            </Space>
                        }
                    >
                        {personalMeetings.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <Space direction="vertical">
                                        <Text>No personal meetings scheduled yet</Text>
                                        <Text type="secondary">Start by creating your first meeting to manage your schedule</Text>
                                        <Button type="primary" onClick={() => openMeetingModal()}>
                                            <PlusOutlined /> Create First Meeting
                                        </Button>
                                    </Space>
                                }
                            />
                        ) : (
                            <Table
                                columns={meetingColumns}
                                dataSource={personalMeetings.map(item => ({ ...item, key: item.id }))}
                                loading={meetingsLoading}
                                pagination={{
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) =>
                                        `${range[0]}-${range[1]} of ${total} meetings`
                                }}
                                scroll={{ x: true }}
                                size="middle"
                            />
                        )}
                    </Card>
                </TabPane>
            </Tabs>

            {/* Meeting Modal */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined />
                        {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
                    </Space>
                }
                open={isMeetingModalVisible}
                onCancel={closeMeetingModal}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={meetingForm}
                    layout="vertical"
                    onFinish={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
                >
                    <Form.Item
                        label="Meeting Topic"
                        name="topic"
                        rules={[
                            { required: true, message: 'Please enter meeting topic' },
                            { min: 3, message: 'Topic must be at least 3 characters' },
                            { max: 200, message: 'Topic cannot exceed 200 characters' }
                        ]}
                    >
                        <Input 
                            placeholder="Enter meeting topic" 
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[
                            { max: 1000, message: 'Description cannot exceed 1000 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter meeting description (optional)"
                            maxLength={1000}
                            showCount
                        />
                    </Form.Item>

                    <Form.Item
                        label="Date Range"
                        name="dateRange"
                        rules={[{ required: true, message: 'Please select date range' }]}
                    >
                        <RangePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Venue/Location"
                        name="venue"
                        rules={[
                            { max: 200, message: 'Venue cannot exceed 200 characters' }
                        ]}
                    >
                        <Input 
                            placeholder="Enter meeting venue or location (optional)" 
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>

                    <Alert
                        message="Meeting Guidelines"
                        description="Please ensure your meeting dates are accurate. Past dates cannot be selected. Meetings will be visible in your personal schedule and may affect your availability for team activities."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={closeMeetingModal}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" size="large">
                                {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Profile;
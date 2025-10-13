import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Button, Row, Col, Typography, Table, DatePicker,
    Space, Tag, Statistic, Alert, Spin, Modal, Form, Input,
    Select, InputNumber, message, Popconfirm, Divider, List,
    Tooltip, Badge, Timeline, Empty, Result, Descriptions,
    Tabs, Switch, Pagination, Progress, Checkbox
} from 'antd';
import {
    TeamOutlined, CalendarOutlined, CheckCircleOutlined,
    UserOutlined, FilterOutlined, PlusOutlined,
    EditOutlined, DeleteOutlined, ScheduleOutlined,
    ExclamationCircleOutlined, ReloadOutlined, WarningOutlined,
    MessageOutlined, WechatOutlined, SendOutlined,
    CloseOutlined, EyeOutlined, SyncOutlined, ClockCircleOutlined,
    InfoCircleOutlined, SafetyCertificateOutlined, BarChartOutlined,
    EnvironmentOutlined, CarryOutOutlined, ShoppingOutlined,
    ContainerOutlined, ToolOutlined, FlagOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Extend dayjs with plugins
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
    <Result
        status="error"
        title="Something went wrong in SCMT Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading SCMT data..." }) => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip={tip} />
    </div>
);

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 1:
                return { color: 'green', text: 'Low', icon: <FlagOutlined /> };
            case 2:
                return { color: 'blue', text: 'Normal', icon: <FlagOutlined /> };
            case 3:
                return { color: 'orange', text: 'Medium', icon: <FlagOutlined /> };
            case 4:
                return { color: 'red', text: 'High', icon: <FlagOutlined /> };
            case 5:
                return { color: 'purple', text: 'Critical', icon: <FlagOutlined /> };
            default:
                return { color: 'default', text: 'Normal', icon: <FlagOutlined /> };
        }
    };

    const config = getPriorityConfig(priority);

    return (
        <Badge
            count={
                <Tag color={config.color} icon={config.icon} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {config.text}
                </Tag>
            }
        />
    );
};

// Statistics Cards Component
const SCMTStatistics = ({ stats, loading = false }) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Total Records"
                    value={stats?.totalRecords || 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Upcoming"
                    value={stats?.upcomingRecords || 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Completed"
                    value={stats?.completedRecords || 0}
                    prefix={<CheckCircleOutlined />}
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
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                />
            </Card>
        </Col>
    </Row>
);

// Category Card Component
const CategoryCard = ({ category, isSelected, onClick, loading = false }) => (
    <Card
        hoverable
        loading={loading}
        style={{
            height: '120px',
            border: `2px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            backgroundColor: isSelected ? '#e6f7ff' : '#fff'
        }}
        bodyStyle={{
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
        }}
        onClick={onClick}
    >
        <div style={{
            fontSize: '32px',
            color: isSelected ? '#1890ff' : '#666',
            marginBottom: '8px'
        }}>
            {category.icon}
        </div>
        <Title level={5} style={{ margin: 0, color: isSelected ? '#1890ff' : '#000' }}>
            {category.name}
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
            {category.type}
        </Text>
    </Card>
);

// Chat Message Component
const ChatMessage = ({ message, currentUser, profiles }) => {
    const senderProfile = profiles.find(p => p.id === message.sender_id);

    return (
        <div style={{
            display: 'flex',
            marginBottom: 16,
            justifyContent: message.sender_id === currentUser?.id ? 'flex-end' : 'flex-start'
        }}>
            <div style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: message.sender_id === currentUser?.id ? 'row-reverse' : 'row',
                alignItems: 'flex-start'
            }}>
                <div>
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        backgroundColor: message.sender_id === currentUser?.id ? '#1890ff' : '#f0f0f0',
                        color: message.sender_id === currentUser?.id ? 'white' : 'black'
                    }}>
                        {message.content}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: 4, display: 'block' }}>
                        {senderProfile?.full_name || 'Unknown User'} • {dayjs(message.created_at).format('DD/MM/YYYY HH:mm')}
                        {message.read_at && ` • Read ${dayjs(message.read_at).format('DD/MM/YYYY HH:mm')}`}
                    </Text>
                </div>
            </div>
        </div>
    );
};

// Discussion Modal Component
const DiscussionModal = React.memo(({
    visible,
    onCancel,
    record,
    category,
    currentUser,
    profiles
}) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [subscription, setSubscription] = useState(null);

    // Get the correct feedback table name
    const getFeedbackTable = useCallback(() => {
        if (!category) return null;
        
        const tableMap = {
            'delivery_distribution': 'scmt_d_n_d_fb',
            'meetings_sessions': 'scmt_meetings_and_sessions_fb',
            'other_operations': 'scmt_others_fb',
            'weekly_meetings_scmt': 'scmt_weekly_meetings_fb'
        };
        
        return tableMap[category.id] || null;
    }, [category]);

    const feedbackTable = getFeedbackTable();

    const fetchMessages = useCallback(async () => {
        if (!record?.id || !category || !feedbackTable) {
            console.warn('Missing required data for fetching messages:', { record, category, feedbackTable });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(feedbackTable)
                .select('*')
                .eq('meeting_id', record.id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [record, category, feedbackTable]);

    const setupRealtimeSubscription = useCallback(() => {
        if (!record?.id || !feedbackTable) return;

        try {
            const subscription = supabase
                .channel(`discussion_${record.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: feedbackTable,
                        filter: `meeting_id=eq.${record.id}`
                    },
                    (payload) => {
                        setMessages(prev => [...prev, payload.new]);
                    }
                )
                .subscribe();

            setSubscription(subscription);
        } catch (error) {
            console.error('Error setting up realtime subscription:', error);
        }
    }, [record, feedbackTable]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !record?.id || !feedbackTable) {
            toast.warning('Cannot send message: Missing required data');
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase
                .from(feedbackTable)
                .insert([{
                    meeting_id: record.id,
                    sender_id: currentUser.id,
                    content: newMessage.trim(),
                    created_at: new Date().toISOString(),
                    priority: 1 // Default priority for messages
                }]);

            if (error) throw error;

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const markMessagesAsRead = useCallback(async () => {
        if (!currentUser || messages.length === 0 || !feedbackTable) return;

        try {
            const unreadMessages = messages.filter(
                msg => msg.sender_id !== currentUser.id && !msg.read_at
            );

            if (unreadMessages.length === 0) return;

            const { error } = await supabase
                .from(feedbackTable)
                .update({ read_at: new Date().toISOString() })
                .in('id', unreadMessages.map(msg => msg.id));

            if (error) throw error;
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, [currentUser, messages, feedbackTable]);

    useEffect(() => {
        if (visible && record && category) {
            fetchMessages();
            setupRealtimeSubscription();
        }

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [visible, record, category, fetchMessages, setupRealtimeSubscription]);

    useEffect(() => {
        if (messages.length > 0) {
            markMessagesAsRead();
        }
    }, [messages, markMessagesAsRead]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Don't render if required data is missing
    if (!category || !record) {
        return (
            <Modal
                title="Discussion"
                open={visible}
                onCancel={onCancel}
                footer={null}
                width={700}
            >
                <Alert
                    message="Unable to load discussion"
                    description="Required data is missing. Please try again."
                    type="error"
                    showIcon
                />
            </Modal>
        );
    }

    return (
        <Modal
            title={
                <Space>
                    <WechatOutlined />
                    Discussion: {record?.type || record?.supplier || record?.location || 'Record'}
                    {record?.date && ` - ${dayjs(record.date).format('DD/MM/YYYY')}`}
                    {record?.start_date && ` - ${dayjs(record.start_date).format('DD/MM/YYYY')}`}
                    {record?.date_of_arrival && ` - ${dayjs(record.date_of_arrival).format('DD/MM/YYYY')}`}
                    <PriorityBadge priority={record.priority} />
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={700}
            style={{ top: 20 }}
            destroyOnClose
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Spin tip="Loading messages..." />
                        </div>
                    ) : messages.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No messages yet. Start the discussion!"
                        />
                    ) : (
                        messages.map(message => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                currentUser={currentUser}
                                profiles={profiles}
                            />
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div style={{ borderTop: '1px solid #d9d9d9', paddingTop: 16 }}>
                    <Space.Compact style={{ width: '100%' }}>
                        <Input.TextArea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message... (Press Enter to send)"
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            disabled={sending}
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={sendMessage}
                            loading={sending}
                            disabled={!newMessage.trim() || !feedbackTable}
                        >
                            Send
                        </Button>
                    </Space.Compact>
                </div>
            </div>
        </Modal>
    );
});

// User Schedule Modal Component
const UserScheduleModal = React.memo(({
    visible,
    onCancel,
    user,
    schedule,
    loading,
    dateRange
}) => {
    const getScheduleItemColor = (item) => {
        try {
            switch (item.type) {
                case 'personal_meeting':
                    return 'blue';
                case 'scmt_activity':
                    return 'green';
                default:
                    return 'gray';
            }
        } catch (error) {
            return 'gray';
        }
    };

    const getScheduleItemIcon = (item) => {
        try {
            switch (item.type) {
                case 'personal_meeting':
                    return <UserOutlined />;
                case 'scmt_activity':
                    return <CalendarOutlined />;
                default:
                    return <ScheduleOutlined />;
            }
        } catch (error) {
            return <ScheduleOutlined />;
        }
    };

    const getActivityType = (item) => {
        if (item.type === 'personal_meeting') return 'Personal Meeting';
        if (item.type === 'scmt_activity') return `SCMT ${item.activity_type}`;
        return 'Unknown Activity';
    };

    const safeDayjs = (date) => {
        try {
            if (!date) return dayjs();
            return dayjs.isDayjs(date) ? date : dayjs(date);
        } catch (error) {
            return dayjs();
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <ScheduleOutlined />
                    Detailed Schedule for {user?.full_name || user?.email}
                    <Tag color="blue">
                        {dateRange[0] ? safeDayjs(dateRange[0]).format('DD/MM/YYYY') : ''} - {dateRange[1] ? safeDayjs(dateRange[1]).format('DD/MM/YYYY') : ''}
                    </Tag>
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel} icon={<CloseOutlined />}>
                    Close
                </Button>
            ]}
            width={800}
            style={{ top: 20 }}
            destroyOnClose
        >
            {loading ? (
                <LoadingSpinner tip="Loading user schedule..." />
            ) : schedule.length > 0 ? (
                <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                    <Timeline>
                        {schedule.map((item, index) => (
                            <Timeline.Item
                                key={index}
                                color={getScheduleItemColor(item)}
                                dot={getScheduleItemIcon(item)}
                            >
                                <div style={{ padding: '8px 0' }}>
                                    <Descriptions 
                                        size="small" 
                                        column={1} 
                                        bordered
                                        style={{ marginBottom: 16 }}
                                    >
                                        <Descriptions.Item label="Activity Type">
                                            <Space>
                                                <Tag color={getScheduleItemColor(item)}>
                                                    {getActivityType(item)}
                                                </Tag>
                                                <PriorityBadge priority={item.priority} />
                                            </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Title">
                                            <Text strong>
                                                {item.topic || item.type || item.activity_type || 'Unknown Activity'}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Date">
                                            <Space>
                                                <CalendarOutlined />
                                                {safeDayjs(item.start_date || item.date || item.date_of_arrival).format('DD/MM/YYYY')}
                                                {item.end_date && ` to ${safeDayjs(item.end_date).format('DD/MM/YYYY')}`}
                                            </Space>
                                        </Descriptions.Item>
                                        {item.location && (
                                            <Descriptions.Item label="Location">
                                                <Tag color="blue">{item.location}</Tag>
                                            </Descriptions.Item>
                                        )}
                                        {item.day && (
                                            <Descriptions.Item label="Day">
                                                <Tag color="purple">{item.day}</Tag>
                                            </Descriptions.Item>
                                        )}
                                        {item.supplier && (
                                            <Descriptions.Item label="Supplier">
                                                {item.supplier}
                                            </Descriptions.Item>
                                        )}
                                        {item.pord_no && (
                                            <Descriptions.Item label="PO Number">
                                                {item.pord_no}
                                            </Descriptions.Item>
                                        )}
                                        {item.description && (
                                            <Descriptions.Item label="Description">
                                                {item.description}
                                            </Descriptions.Item>
                                        )}
                                        {item.remarks && (
                                            <Descriptions.Item label="Remarks">
                                                {item.remarks}
                                            </Descriptions.Item>
                                        )}
                                        {item.responsible_2 && (
                                            <Descriptions.Item label="Responsible Person">
                                                {item.responsible_2}
                                            </Descriptions.Item>
                                        )}
                                    </Descriptions>
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                    
                    <Alert
                        message={`Total ${schedule.length} scheduled items found`}
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                </div>
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <Space direction="vertical">
                            <Text>No scheduled activities found for this period</Text>
                            <Text type="secondary">User is available during {dateRange[0] ? safeDayjs(dateRange[0]).format('DD/MM/YYYY') : ''} to {dateRange[1] ? safeDayjs(dateRange[1]).format('DD/MM/YYYY') : ''}</Text>
                        </Space>
                    }
                />
            )}
        </Modal>
    );
});

const SCMT = () => {
    // Error handling states
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Auto-refresh states
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [tableData, setTableData] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    // User Availability States
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [scmtUsers, setScmtUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSchedule, setUserSchedule] = useState([]);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityDateRange, setAvailabilityDateRange] = useState([null, null]);

    // Discussion States
    const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    // User Schedule Modal State
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

    // Priority filter state
    const [priorityFilter, setPriorityFilter] = useState(null);

    // SCMT Categories configuration
    const scmtCategories = [
        {
            id: 'delivery_distribution',
            name: 'Delivery and Distribution',
            table: 'scmt_d_n_d',
            type: 'Task',
            icon: <CarryOutOutlined />,
            dateField: 'start_date',
            color: '#1890ff'
        },
        {
            id: 'meetings_sessions',
            name: 'Meetings and Sessions',
            table: 'scmt_meetings_and_sessions',
            type: 'Meeting',
            icon: <CalendarOutlined />,
            dateField: 'date',
            color: '#52c41a'
        },
        {
            id: 'other_operations',
            name: 'Other Operations Activities',
            table: 'scmt_others',
            type: 'Task',
            icon: <CheckCircleOutlined />,
            dateField: 'date',
            color: '#fa8c16'
        },
        {
            id: 'weekly_meetings_scmt',
            name: 'Weekly Shipments',
            table: 'scmt_weekly_meetings',
            type: 'Task',
            icon: <ShoppingOutlined />,
            dateField: 'date_of_arrival',
            color: '#722ed1'
        }
    ];

    // Priority options
    const priorityOptions = [
        { value: 1, label: 'Low', color: 'green' },
        { value: 2, label: 'Normal', color: 'blue' },
        { value: 3, label: 'Medium', color: 'orange' },
        { value: 4, label: 'High', color: 'red' },
        { value: 5, label: 'Critical', color: 'purple' }
    ];

    // Get default date range: yesterday to 9 days from today (total 10 days)
    const getDefaultDateRange = useCallback(() => {
        try {
            const yesterday = dayjs().subtract(1, 'day');
            const nineDaysFromToday = dayjs().add(9, 'day');
            return [yesterday, nineDaysFromToday];
        } catch (error) {
            console.error('Error getting default date range:', error);
            return [dayjs(), dayjs().add(10, 'day')];
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

    // Reset error boundary
    const resetErrorBoundary = useCallback(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
        initializeSCMT();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshSCMTData();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshSCMTData = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.info('SCMT data updated automatically');
        } catch (error) {
            handleError(error, 'auto-refresh');
        } finally {
            setIsRefreshing(false);
        }
    };

    const manualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.success('SCMT data refreshed successfully');
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

    // Initialize SCMT module
    const initializeSCMT = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchProfiles(),
                fetchSCMTUsers()
            ]);
            
            // Set default date range after initialization
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'initializing SCMT module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeSCMT();
    }, [retryCount]);

    useEffect(() => {
        const cleanup = setupAutoRefresh();
        return cleanup;
    }, [setupAutoRefresh]);

    useEffect(() => {
        if (selectedCategory && dateRange[0] && dateRange[1]) {
            fetchTableData();
        }
    }, [selectedCategory, dateRange, priorityFilter]);

    const fetchCurrentUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                safeSetState(setCurrentUser, user);
            }
        } catch (error) {
            handleError(error, 'fetching current user');
        }
    };

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, department_id')
                .order('full_name');

            if (error) throw error;
            safeSetState(setProfiles, data || []);
        } catch (error) {
            handleError(error, 'fetching profiles');
            safeSetState(setProfiles, []);
        }
    };

    const fetchSCMTUsers = async () => {
        try {
            // First get the SCMT department ID
            const { data: deptData, error: deptError } = await supabase
                .from('departments')
                .select('id')
                .eq('name', 'SCMT')
                .single();

            if (deptError) {
                // If SCMT department doesn't exist, try case-insensitive search
                const { data: deptDataAlt, error: deptErrorAlt } = await supabase
                    .from('departments')
                    .select('id')
                    .ilike('name', '%scmt%')
                    .single();

                if (deptErrorAlt) throw deptErrorAlt;
                if (!deptDataAlt) {
                    toast.warning('SCMT department not found. Using all users as fallback.');
                    // Fallback to all users
                    const { data: allUsers, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, department_id')
                        .order('full_name');

                    if (usersError) throw usersError;
                    safeSetState(setScmtUsers, allUsers || []);
                    return;
                }

                safeSetState(setScmtUsers, []);
                return;
            }

            if (!deptData) {
                toast.warning('SCMT department not found');
                safeSetState(setScmtUsers, []);
                return;
            }

            // Then get all users in SCMT department
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, department_id')
                .eq('department_id', deptData.id)
                .order('full_name');

            if (usersError) throw usersError;
            safeSetState(setScmtUsers, usersData || []);
        } catch (error) {
            handleError(error, 'fetching SCMT users');
            safeSetState(setScmtUsers, []);
        }
    };

    const fetchTableData = async () => {
        if (!selectedCategory || !dateRange[0] || !dateRange[1]) return;

        setLoading(true);
        try {
            const startDate = safeDayjs(dateRange[0]).format('YYYY-MM-DD');
            const endDate = safeDayjs(dateRange[1]).format('YYYY-MM-DD');

            if (!startDate || !endDate) {
                throw new Error('Invalid date range provided');
            }

            let query = supabase
                .from(selectedCategory.table)
                .select('*')
                .gte(selectedCategory.dateField, startDate)
                .lte(selectedCategory.dateField, endDate)
                .order('priority', { ascending: false }) // Sort by priority (high to low)
                .order(selectedCategory.dateField, { ascending: true });

            // Apply priority filter if selected
            if (priorityFilter) {
                query = query.eq('priority', priorityFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            safeSetState(setTableData, data || []);

            // Fetch unread counts after loading table data
            if (data && data.length > 0) {
                fetchUnreadCounts(data, selectedCategory);
            }
        } catch (error) {
            handleError(error, `fetching ${selectedCategory?.name} data`);
            safeSetState(setTableData, []);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCounts = async (records, category) => {
        if (!currentUser || !records.length || !category) return;

        try {
            const tableMap = {
                'delivery_distribution': 'scmt_d_n_d_fb',
                'meetings_sessions': 'scmt_meetings_and_sessions_fb',
                'other_operations': 'scmt_others_fb',
                'weekly_meetings_scmt': 'scmt_weekly_meetings_fb'
            };
            
            const feedbackTable = tableMap[category.id];
            if (!feedbackTable) return;

            const counts = {};

            for (const record of records) {
                const { data, error } = await supabase
                    .from(feedbackTable)
                    .select('id')
                    .eq('meeting_id', record.id)
                    .neq('sender_id', currentUser.id)
                    .is('read_at', null);

                if (!error) {
                    counts[record.id] = data?.length || 0;
                }
            }

            safeSetState(setUnreadCounts, counts);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    const fetchUserSchedule = async (userId, startDate, endDate) => {
        setAvailabilityLoading(true);
        try {
            const formattedStart = safeDayjs(startDate).format('YYYY-MM-DD');
            const formattedEnd = safeDayjs(endDate).format('YYYY-MM-DD');

            // Get ALL data from all tables without user filtering first
            let allActivities = [];

            // Personal meetings
            const { data: personalMeetings } = await supabase
                .from('personal_meetings')
                .select('*')
                .eq('user_id', userId)
                .gte('start_date', formattedStart)
                .lte('end_date', formattedEnd)
                .order('priority', { ascending: false })
                .order('start_date', { ascending: true });

            // SCMT activities from all categories
            for (const category of scmtCategories) {
                const { data: activities } = await supabase
                    .from(category.table)
                    .select('*')
                    .eq('user_id', userId)
                    .gte(category.dateField, formattedStart)
                    .lte(category.dateField, formattedEnd)
                    .order('priority', { ascending: false })
                    .order(category.dateField, { ascending: true });

                if (activities) {
                    allActivities.push(...activities.map(activity => ({
                        ...activity,
                        type: 'scmt_activity',
                        activity_type: category.name,
                        source_table: category.table
                    })));
                }
            }

            // Combine all activities
            const allSchedule = [
                ...(personalMeetings || []).map(meeting => ({
                    ...meeting,
                    type: 'personal_meeting'
                })),
                ...allActivities
            ];

            safeSetState(setUserSchedule, allSchedule);
            
        } catch (error) {
            handleError(error, 'fetching user schedule');
            safeSetState(setUserSchedule, []);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        try {
            safeSetState(setSelectedCategory, category);
            safeSetState(setTableData, []);
            safeSetState(setEditingRecord, null);
            safeSetState(setPriorityFilter, null);
            form.resetFields();
            
            // Set default date range when category is selected
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'selecting category');
        }
    };

    const handleDateRangeChange = (dates) => {
        try {
            safeSetState(setDateRange, dates || [null, null]);
        } catch (error) {
            handleError(error, 'changing date range');
        }
    };

    const handlePriorityFilterChange = (value) => {
        try {
            safeSetState(setPriorityFilter, value);
        } catch (error) {
            handleError(error, 'changing priority filter');
        }
    };

    const handleCreate = () => {
        try {
            safeSetState(setEditingRecord, null);
            form.resetFields();
            safeSetState(setModalVisible, true);
        } catch (error) {
            handleError(error, 'creating new record');
        }
    };

    const handleEdit = (record) => {
        try {
            if (!record || !record.id) {
                throw new Error('Invalid record provided for editing');
            }

            safeSetState(setEditingRecord, record);
            const formattedRecord = { ...record };

            // Format date fields based on category with error handling
            try {
                if (selectedCategory.id === 'delivery_distribution' && record.start_date) {
                    formattedRecord.start_date = safeDayjs(record.start_date);
                }
                if ((selectedCategory.id === 'meetings_sessions' || selectedCategory.id === 'other_operations') && record.date) {
                    formattedRecord.date = safeDayjs(record.date);
                }
                if (selectedCategory.id === 'weekly_meetings_scmt' && record.date_of_arrival) {
                    formattedRecord.date_of_arrival = safeDayjs(record.date_of_arrival);
                }
            } catch (dateError) {
                console.warn('Error formatting dates for editing:', dateError);
            }

            form.setFieldsValue(formattedRecord);
            safeSetState(setModalVisible, true);
        } catch (error) {
            handleError(error, 'editing record');
        }
    };

    const handleDelete = async (record) => {
        try {
            if (!record?.id) throw new Error('Invalid record ID');
            if (!selectedCategory?.table) throw new Error('No category selected');

            const { error } = await supabase
                .from(selectedCategory.table)
                .delete()
                .eq('id', record.id);

            if (error) throw error;

            toast.success('Record deleted successfully');
            fetchTableData();
        } catch (error) {
            handleError(error, 'deleting record');
        }
    };

    const handleUserAvailabilityClick = () => {
        try {
            // Set default date range for availability modal
            const defaultRange = getDefaultDateRange();
            
            safeSetState(setAvailabilityModalVisible, true);
            safeSetState(setSelectedUser, null);
            safeSetState(setUserSchedule, []);
            safeSetState(setAvailabilityDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'opening availability modal');
        }
    };

    const handleUserSelect = async (user) => {
        try {
            safeSetState(setSelectedUser, user);
            
            if (availabilityDateRange[0] && availabilityDateRange[1]) {
                await fetchUserSchedule(user.id, availabilityDateRange[0], availabilityDateRange[1]);
                // Open the schedule modal after fetching data
                safeSetState(setScheduleModalVisible, true);
            } else {
                toast.warning('Please select a date range first');
            }
        } catch (error) {
            handleError(error, 'selecting user');
        }
    };

    const handleAvailabilityDateChange = (dates) => {
        try {
            safeSetState(setAvailabilityDateRange, dates || [null, null]);
        } catch (error) {
            handleError(error, 'changing availability date range');
        }
    };

    const handleDiscussionClick = (record) => {
        try {
            if (!selectedCategory) {
                toast.warning('Please select a category first');
                return;
            }
            safeSetState(setSelectedRecord, record);
            safeSetState(setDiscussionModalVisible, true);
        } catch (error) {
            handleError(error, 'opening discussion');
        }
    };

    const getTableColumns = () => {
        if (!selectedCategory) return [];

        try {
            const actionColumn = {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 180,
                render: (_, record) => (
                    <Space size="small">
                        <Tooltip title="Discuss">
                            <Badge count={unreadCounts[record.id] || 0} size="small">
                                <Button
                                    type={unreadCounts[record.id] > 0 ? "primary" : "default"}
                                    icon={<MessageOutlined />}
                                    onClick={() => handleDiscussionClick(record)}
                                    size="small"
                                    danger={unreadCounts[record.id] > 0}
                                >
                                    Discuss
                                </Button>
                            </Badge>
                        </Tooltip>
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            size="small"
                        >
                            Edit
                        </Button>
                        <Popconfirm
                            title="Are you sure to delete this record?"
                            onConfirm={() => handleDelete(record)}
                            okText="Yes"
                            cancelText="No"
                            okType="danger"
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            };

            const priorityColumn = {
                title: 'Priority',
                dataIndex: 'priority',
                key: 'priority',
                width: 100,
                render: (priority) => <PriorityBadge priority={priority} />,
                sorter: (a, b) => a.priority - b.priority,
            };

            const baseColumns = [
                {
                    title: 'Created',
                    dataIndex: 'created_at',
                    key: 'created_at',
                    render: (date) => {
                        try {
                            return date ? safeDayjs(date).format('DD/MM/YYYY') : '-';
                        } catch (error) {
                            console.warn('Error formatting created_at date:', error);
                            return '-';
                        }
                    },
                    width: 100
                },
                priorityColumn
            ];

            switch (selectedCategory.id) {
                case 'delivery_distribution':
                    return [
                        ...baseColumns,
                        { title: 'Day', dataIndex: 'day', key: 'day', width: 100 },
                        { title: 'Location', dataIndex: 'location', key: 'location', width: 150 },
                        { title: 'Start Date', dataIndex: 'start_date', key: 'start_date', width: 120 },
                        { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 200 },
                        { title: 'Responsible Person', dataIndex: 'responsible_2', key: 'responsible_2', width: 150 },
                        actionColumn
                    ];

                case 'meetings_sessions':
                    return [
                        ...baseColumns,
                        { title: 'Day', dataIndex: 'day', key: 'day', width: 100 },
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
                        { title: 'Location', dataIndex: 'location', key: 'location', width: 150 },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 200 },
                        { title: 'Responsible Person', dataIndex: 'responsible_2', key: 'responsible_2', width: 150 },
                        actionColumn
                    ];

                case 'other_operations':
                    return [
                        ...baseColumns,
                        { title: 'Day', dataIndex: 'day', key: 'day', width: 100 },
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
                        { title: 'Location', dataIndex: 'location', key: 'location', width: 150 },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 200 },
                        { title: 'Responsible Person', dataIndex: 'responsible_2', key: 'responsible_2', width: 150 },
                        actionColumn
                    ];

                case 'weekly_meetings_scmt':
                    return [
                        ...baseColumns,
                        {
                            title: 'Supplier',
                            dataIndex: 'supplier',
                            key: 'supplier',
                            width: 150,
                            render: (supplier) => supplier || '-'
                        },
                        {
                            title: 'PO Number',
                            dataIndex: 'pord_no',
                            key: 'pord_no',
                            width: 120,
                            render: (pord_no) => pord_no || '-'
                        },
                        {
                            title: 'Reagent',
                            dataIndex: 'reagent',
                            key: 'reagent',
                            width: 80,
                            render: (reagent) => (
                                <Tag color={reagent ? 'green' : 'red'}>
                                    {reagent ? 'Yes' : 'No'}
                                </Tag>
                            )
                        },
                        {
                            title: 'Spare Part',
                            dataIndex: 'spare_part',
                            key: 'spare_part',
                            width: 100,
                            render: (spare_part) => (
                                <Tag color={spare_part ? 'green' : 'red'}>
                                    {spare_part ? 'Yes' : 'No'}
                                </Tag>
                            )
                        },
                        {
                            title: 'Instruments',
                            dataIndex: 'instruments',
                            key: 'instruments',
                            width: 100,
                            render: (instruments) => (
                                <Tag color={instruments ? 'green' : 'red'}>
                                    {instruments ? 'Yes' : 'No'}
                                </Tag>
                            )
                        },
                        {
                            title: 'Date of Arrival',
                            dataIndex: 'date_of_arrival',
                            key: 'date_of_arrival',
                            width: 120,
                            render: (date) => {
                                try {
                                    return date ? safeDayjs(date).format('DD/MM/YYYY') : '-';
                                } catch (error) {
                                    console.warn('Error formatting date_of_arrival:', error);
                                    return '-';
                                }
                            }
                        },
                        {
                            title: 'Mode',
                            dataIndex: 'mode',
                            key: 'mode',
                            width: 100,
                            render: (mode) => mode || '-'
                        },
                        {
                            title: 'Main Item List',
                            dataIndex: 'main_item_list',
                            key: 'main_item_list',
                            width: 200,
                            render: (items) => items || '-'
                        },
                        actionColumn
                    ];

                default:
                    return [...baseColumns, actionColumn];
            }
        } catch (error) {
            handleError(error, 'generating table columns');
            return [];
        }
    };

    const getFormFields = () => {
        if (!selectedCategory) return null;

        try {
            const commonFields = (
                <>
                    <Form.Item
                        name="day"
                        label="Day"
                        rules={[{ required: true, message: 'Please enter day' }]}
                    >
                        <Select placeholder="Select day">
                            <Option value="Monday">Monday</Option>
                            <Option value="Tuesday">Tuesday</Option>
                            <Option value="Wednesday">Wednesday</Option>
                            <Option value="Thursday">Thursday</Option>
                            <Option value="Friday">Friday</Option>
                            <Option value="Saturday">Saturday</Option>
                            <Option value="Sunday">Sunday</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="location"
                        label="Location"
                        rules={[{ required: true, message: 'Please enter location' }]}
                    >
                        <Input placeholder="Enter location" />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Type"
                    >
                        <Input placeholder="Enter activity type" />
                    </Form.Item>

                    <Form.Item
                        name="priority"
                        label="Priority"
                        initialValue={2}
                        rules={[{ required: true, message: 'Please select priority' }]}
                    >
                        <Select placeholder="Select priority">
                            {priorityOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    <Space>
                                        <Badge color={option.color} />
                                        {option.label}
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="responsible_2"
                        label="Responsible Person"
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select responsible persons"
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {scmtUsers.map(user => (
                                <Option key={user.id} value={user.full_name || user.email}>
                                    {user.full_name || user.email}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </>
            );

            switch (selectedCategory.id) {
                case 'delivery_distribution':
                    return (
                        <>
                            <Form.Item
                                name="start_date"
                                label="Start Date"
                                rules={[{ required: true, message: 'Please select start date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select start date"
                                />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'meetings_sessions':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Meeting Date"
                                rules={[{ required: true, message: 'Please select meeting date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select meeting date"
                                />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'other_operations':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Activity Date"
                                rules={[{ required: true, message: 'Please select activity date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select activity date"
                                />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'weekly_meetings_scmt':
                    return (
                        <>
                            <Form.Item
                                name="supplier"
                                label="Supplier"
                                rules={[{ required: true, message: 'Please enter supplier name' }]}
                            >
                                <Input
                                    placeholder="Enter supplier name"
                                    prefix={<ShoppingOutlined />}
                                />
                            </Form.Item>

                            <Form.Item
                                name="pord_no"
                                label="PO Number"
                            >
                                <Input
                                    placeholder="Enter purchase order number"
                                    prefix={<ContainerOutlined />}
                                />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="reagent"
                                        label="Reagent"
                                        valuePropName="checked"
                                    >
                                        <Checkbox>Reagent</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="spare_part"
                                        label="Spare Part"
                                        valuePropName="checked"
                                    >
                                        <Checkbox>Spare Part</Checkbox>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="instruments"
                                        label="Instruments"
                                        valuePropName="checked"
                                    >
                                        <Checkbox>Instruments</Checkbox>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="date_of_arrival"
                                label="Date of Arrival"
                                rules={[{ required: true, message: 'Please select date of arrival' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select date of arrival"
                                />
                            </Form.Item>

                            <Form.Item
                                name="mode"
                                label="Mode"
                            >
                                <Select placeholder="Select mode">
                                    <Option value="Air">Air</Option>
                                    <Option value="Sea">Sea</Option>
                                    <Option value="Land">Land</Option>
                                    <Option value="Courier">Courier</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="main_item_list"
                                label="Main Item List"
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Enter main item list details"
                                />
                            </Form.Item>

                            <Form.Item
                                name="priority"
                                label="Priority"
                                initialValue={2}
                                rules={[{ required: true, message: 'Please select priority' }]}
                            >
                                <Select placeholder="Select priority">
                                    {priorityOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            <Space>
                                                <Badge color={option.color} />
                                                {option.label}
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </>
                    );

                default:
                    return commonFields;
            }
        } catch (error) {
            handleError(error, 'generating form fields');
            return <Alert message="Error loading form" type="error" />;
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            if (!selectedCategory?.table) {
                throw new Error('No category selected');
            }

            // Prepare data for submission
            const submitData = { ...values };

            // Convert dayjs objects to ISO strings with error handling
            Object.keys(submitData).forEach(key => {
                try {
                    if (dayjs.isDayjs(submitData[key])) {
                        submitData[key] = safeDayjs(submitData[key]).format('YYYY-MM-DD');
                    }
                } catch (dateError) {
                    console.warn(`Error converting date field ${key}:`, dateError);
                }
            });

            if (editingRecord) {
                const { error } = await supabase
                    .from(selectedCategory.table)
                    .update(submitData)
                    .eq('id', editingRecord.id);

                if (error) throw error;
                toast.success('Record updated successfully');
            } else {
                const { error } = await supabase
                    .from(selectedCategory.table)
                    .insert([submitData]);

                if (error) throw error;
                toast.success('Record created successfully');
            }

            safeSetState(setModalVisible, false);
            fetchTableData();
        } catch (error) {
            handleError(error, 'saving record');
        }
    };

    const getStats = () => {
        try {
            if (!selectedCategory || !tableData.length) {
                return { totalRecords: 0, upcomingRecords: 0, completedRecords: 0, completionRate: 0 };
            }

            const totalRecords = tableData.length;
            const now = safeDayjs();

            const upcomingRecords = tableData.filter(item => {
                try {
                    const itemDate = safeDayjs(item[selectedCategory.dateField]);
                    return itemDate.isValid() && itemDate.isAfter(now, 'day');
                } catch (error) {
                    console.warn('Error processing upcoming record:', error);
                    return false;
                }
            }).length;

            const completedRecords = tableData.filter(item => {
                try {
                    const itemDate = safeDayjs(item[selectedCategory.dateField]);
                    return itemDate.isValid() && itemDate.isBefore(now, 'day');
                } catch (error) {
                    console.warn('Error processing completed record:', error);
                    return false;
                }
            }).length;

            const completionRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

            return { totalRecords, upcomingRecords, completedRecords, completionRate };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return { totalRecords: 0, upcomingRecords: 0, completedRecords: 0, completionRate: 0 };
        }
    };

    // Render error state
    if (error && retryCount > 2) {
        return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    // Render loading state
    if (loading && !selectedCategory) {
        return <LoadingSpinner tip="Loading SCMT module..." />;
    }

    const stats = getStats();

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="SCMT Module Error"
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
                            <TeamOutlined /> SCMT - Customer Care Department
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
                            <Button
                                type="primary"
                                icon={<UserOutlined />}
                                onClick={handleUserAvailabilityClick}
                                size="large"
                            >
                                Check Team Availability
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {autoRefresh && (
                <Alert
                    message="Auto-refresh Enabled"
                    description="SCMT data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Category Cards */}
            <Card 
                title="SCMT Categories" 
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color="blue">
                        {scmtCategories.length} Categories Available
                    </Tag>
                }
            >
                <Row gutter={[16, 16]}>
                    {scmtCategories.map((category) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                            <CategoryCard
                                category={category}
                                isSelected={selectedCategory?.id === category.id}
                                onClick={() => handleCategoryClick(category)}
                                loading={loading}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* Date Range Filter and Create Button */}
            {selectedCategory && (
                <Card
                    title={
                        <Space>
                            <FilterOutlined />
                            Filter Data
                            <Tag color="blue">
                                Default: {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                            </Tag>
                        </Space>
                    }
                    style={{ marginBottom: 24 }}
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreate}
                            loading={loading}
                            size="large"
                        >
                            Add New Record
                        </Button>
                    }
                >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Text>Select date range to view {selectedCategory.name} data:</Text>
                                <RangePicker
                                    onChange={handleDateRangeChange}
                                    value={dateRange}
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabled={loading}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <Text>Filter by priority:</Text>
                                <Select
                                    placeholder="All Priorities"
                                    value={priorityFilter}
                                    onChange={handlePriorityFilterChange}
                                    style={{ width: '100%' }}
                                    allowClear
                                >
                                    {priorityOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            <Space>
                                                <Badge color={option.color} />
                                                {option.label}
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>
                        {dateRange[0] && dateRange[1] && (
                            <Text type="secondary">
                                Showing data from {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} to {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                                {priorityFilter && ` • Priority: ${priorityOptions.find(opt => opt.value === priorityFilter)?.label}`}
                                <Text style={{ marginLeft: 8, color: '#1890ff' }}>
                                    (Default range: Yesterday to 9 days from today)
                                </Text>
                            </Text>
                        )}
                    </Space>
                </Card>
            )}

            {/* Statistics */}
            {selectedCategory && dateRange[0] && dateRange[1] && (
                <>
                    <SCMTStatistics stats={stats} loading={loading} />
                    
                    {/* Progress Bar for Completion Rate */}
                    <Card style={{ marginBottom: 24 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>Overall Completion Progress</Text>
                            <Progress 
                                percent={stats.completionRate} 
                                status={stats.completionRate >= 80 ? "success" : "active"}
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                            />
                            <Text type="secondary">
                                {stats.completedRecords} of {stats.totalRecords} records completed ({stats.completionRate}%)
                            </Text>
                        </Space>
                    </Card>
                </>
            )}

            {/* Data Table */}
            {selectedCategory && dateRange[0] && dateRange[1] && (
                <Card
                    title={
                        <Space>
                            {selectedCategory.icon}
                            {selectedCategory.name} Data
                            <Badge count={tableData.length} showZero color="#1890ff" />
                        </Space>
                    }
                    extra={
                        <Space>
                            <Tag color="blue">
                                {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                            </Tag>
                            {priorityFilter && (
                                <Tag color={priorityOptions.find(opt => opt.value === priorityFilter)?.color}>
                                    Priority: {priorityOptions.find(opt => opt.value === priorityFilter)?.label}
                                </Tag>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={manualRefresh}
                                loading={loading}
                                size="small"
                            >
                                Refresh Data
                            </Button>
                        </Space>
                    }
                >
                    {loading ? (
                        <LoadingSpinner tip={`Loading ${selectedCategory.name} data...`} />
                    ) : tableData.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Space direction="vertical">
                                    <Text>No records found for selected criteria</Text>
                                    <Text type="secondary">Try selecting a different date range, priority filter, or create new records</Text>
                                    <Button type="primary" onClick={handleCreate}>
                                        <PlusOutlined /> Create First Record
                                    </Button>
                                </Space>
                            }
                        />
                    ) : (
                        <Table
                            columns={getTableColumns()}
                            dataSource={tableData.map(item => ({ ...item, key: item.id }))}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} items`
                            }}
                            scroll={{ x: true }}
                            size="middle"
                        />
                    )}
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingRecord ? <EditOutlined /> : <PlusOutlined />}
                        {editingRecord ? 'Edit' : 'Create'} {selectedCategory?.name} Record
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={selectedCategory?.id === 'weekly_meetings_scmt' ? 700 : 600}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                >
                    {getFormFields()}

                    <Divider />

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" size="large">
                                {editingRecord ? 'Update' : 'Create'} Record
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* User Availability Modal */}
            <Modal
                title={
                    <Space>
                        <UserOutlined />
                        Check SCMT Team Availability
                        <Tag color="blue">
                            Default: {availabilityDateRange[0] ? safeDayjs(availabilityDateRange[0]).format('DD/MM/YYYY') : ''} - {availabilityDateRange[1] ? safeDayjs(availabilityDateRange[1]).format('DD/MM/YYYY') : ''}
                        </Tag>
                    </Space>
                }
                open={availabilityModalVisible}
                onCancel={() => setAvailabilityModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Date Range Selection */}
                    <Card size="small" title="Select Date Range">
                        <RangePicker
                            onChange={handleAvailabilityDateChange}
                            value={availabilityDateRange}
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                        />
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            Default range: Yesterday to 9 days from today
                        </Text>
                    </Card>

                    {/* SCMT Users List */}
                    <Card size="small" title="SCMT Team Members">
                        {scmtUsers.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No SCMT team members found"
                            />
                        ) : (
                            <List
                                dataSource={scmtUsers}
                                renderItem={user => (
                                    <List.Item
                                        actions={[
                                            <Tooltip 
                                                key="view" 
                                                title={!availabilityDateRange[0] || !availabilityDateRange[1] ? "Please select date range first" : "View detailed schedule"}
                                            >
                                                <Button
                                                    type="primary"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => handleUserSelect(user)}
                                                    disabled={!availabilityDateRange[0] || !availabilityDateRange[1]}
                                                    loading={availabilityLoading && selectedUser?.id === user.id}
                                                    size="small"
                                                >
                                                    View Schedule
                                                </Button>
                                            </Tooltip>
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={user.full_name || user.email}
                                            description={
                                                <Badge 
                                                    status="success" 
                                                    text="SCMT Team Member" 
                                                />
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>

                    {/* Availability Tips */}
                    <Alert
                        message="Availability Check Tips"
                        description={
                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                <li>Default date range is set to yesterday to 9 days from today</li>
                                <li>Select a different date range if needed</li>
                                <li>Click "View Schedule" to see user's detailed schedule in a popup</li>
                                <li>The schedule popup shows comprehensive details of all activities</li>
                                <li>Empty schedule means the user is available during the selected period</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                    />
                </Space>
            </Modal>

            {/* User Schedule Modal */}
            <UserScheduleModal
                visible={scheduleModalVisible}
                onCancel={() => setScheduleModalVisible(false)}
                user={selectedUser}
                schedule={userSchedule}
                loading={availabilityLoading}
                dateRange={availabilityDateRange}
            />

            {/* Discussion Modal */}
            <DiscussionModal
                visible={discussionModalVisible}
                onCancel={() => setDiscussionModalVisible(false)}
                record={selectedRecord}
                category={selectedCategory}
                currentUser={currentUser}
                profiles={profiles}
            />

            {/* Instructions */}
            {!selectedCategory && (
                <Card title="How to Use SCMT Module">
                    <Alert
                        message="Manage SCMT - Customer Care Department Data"
                        description={
                            <div>
                                <Text strong>Follow these steps:</Text>
                                <ol>
                                    <li>Click on any category card above to select a data type</li>
                                    <li>Date range is automatically set to yesterday to 9 days from today</li>
                                    <li>Use priority filter to view high-priority items first</li>
                                    <li>View the filtered data in the table below (sorted by priority)</li>
                                    <li>Use the "Add New Record" button to create new entries</li>
                                    <li>Use Edit/Delete actions in the table to manage records</li>
                                    <li>Use "Discuss" button to participate in group discussions for each record</li>
                                    <li>Red badge on Discuss button shows unread messages</li>
                                    <li>Use "Check Team Availability" to view team schedules in popup windows</li>
                                    <li>Enable auto-refresh for automatic data updates every 2 minutes</li>
                                </ol>
                                <Text type="secondary">
                                    SCMT - Customer Care department manages delivery, distribution, meetings, operational activities, and weekly shipments.
                                    Default date range shows data from yesterday to 9 days in the future (10 days total).
                                    Priority levels help you focus on critical tasks first.
                                    Schedule details open in convenient popup windows for better visibility.
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </Card>
            )}
        </div>
    );
};

export default SCMT;
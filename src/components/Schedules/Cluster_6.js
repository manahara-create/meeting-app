import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Button, Row, Col, Typography, Table, DatePicker,
    Space, Tag, Statistic, Alert, Spin, Modal, Form, Input,
    Select, InputNumber, message, Popconfirm, Divider, List,
    Tooltip, Badge, Timeline, Empty, Result, Descriptions,
    Tabs, Switch, Pagination, Progress, Rate, TimePicker, Radio, Dropdown, Upload
} from 'antd';
import {
    TeamOutlined, CalendarOutlined, CheckCircleOutlined,
    UserOutlined, FilterOutlined, PlusOutlined,
    EditOutlined, DeleteOutlined, ScheduleOutlined,
    ExclamationCircleOutlined, ReloadOutlined, WarningOutlined,
    MessageOutlined, WechatOutlined, SendOutlined,
    CloseOutlined, EyeOutlined, SyncOutlined, ClockCircleOutlined,
    InfoCircleOutlined, SafetyCertificateOutlined, BarChartOutlined,
    StarOutlined, FlagOutlined, FileExcelOutlined, GlobalOutlined,
    AppstoreOutlined, BarsOutlined, DownloadOutlined, FilePdfOutlined,
    UploadOutlined, FileAddOutlined, FileWordOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { notifyDepartmentOperation, NOTIFICATION_TYPES } from '../../services/notifications';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table as DocTable, TableRow, TableCell, WidthType } from 'docx';

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
        title="Something went wrong in Cluster 6 Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading Cluster 6 data..." }) => (
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
const Cluster6Statistics = ({ stats, loading = false }) => (
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

    // Get the correct feedback table name for Cluster 6
    const getFeedbackTable = useCallback(() => {
        if (!category) return null;

        const tableMap = {
            'visit_plan': 'cluster_6_visit_plan_fb',
            'meetings': 'cluster_6_meetings_fb',
            'special_task': 'cluster_6_special_task_fb'
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
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            await notifyDepartmentOperation(
                'cluster_6',
                category.name,
                NOTIFICATION_TYPES.DISCUSSION,
                record,
                {
                    tableName: feedbackTable,
                    userId: currentUser.id,
                    message: 'New message in discussion'
                }
            );

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
                    Discussion: {record?.subject || record?.name || record?.task || 'Record'}
                    {record?.date && ` - ${dayjs(record.date).format('DD/MM/YYYY')}`}
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
                case 'cluster_6_activity':
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
                case 'cluster_6_activity':
                    return <CalendarOutlined />;
                default:
                    return <ScheduleOutlined />;
            }
        } catch (error) {
            return <ScheduleOutlined />;
        }
    };

    const getActivityType = (item) => {
        try {
            if (item.type === 'personal_meeting') return 'Personal Meeting';
            if (item.type === 'cluster_6_activity') return `Cluster 6 ${item.activity_type}`;
            return 'Activity';
        } catch (error) {
            return 'Activity';
        }
    };

    const getActivityDescription = (item) => {
        try {
            if (item.type === 'personal_meeting') {
                return item.description || 'No description available';
            }
            if (item.type === 'cluster_6_activity') {
                return item.remarks || item.purpose || 'No description available';
            }
            return 'No description available';
        } catch (error) {
            return 'Description not available';
        }
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
                                                {item.subject || item.name || item.task || 'Activity'}
                                            </Text>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Date">
                                            <Space>
                                                <CalendarOutlined />
                                                {safeDayjs(item.date).format('DD/MM/YYYY')}
                                            </Space>
                                        </Descriptions.Item>

                                        <Descriptions.Item label="Description">
                                            <Text type="secondary">
                                                {getActivityDescription(item)}
                                            </Text>
                                        </Descriptions.Item>

                                        {item.area && (
                                            <Descriptions.Item label="Area">
                                                <Tag color="blue">{item.area}</Tag>
                                            </Descriptions.Item>
                                        )}
                                        {item.status && (
                                            <Descriptions.Item label="Status">
                                                <Tag color={
                                                    item.status.toLowerCase() === 'completed' ? 'green' : 
                                                    item.status.toLowerCase() === 'in progress' ? 'orange' : 'blue'
                                                }>
                                                    {item.status}
                                                </Tag>
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

// Bulk Form Fields Component
const BulkFormFields = ({ records, onChange, category, priorityOptions, safeDayjs, profiles }) => {
    const updateRecord = (index, field, value) => {
        const newRecords = [...records];
        newRecords[index] = {
            ...newRecords[index],
            [field]: value
        };
        onChange(newRecords);
    };

    const addRecord = () => {
        onChange([...records, {}]);
    };

    const removeRecord = (index) => {
        if (records.length > 1) {
            const newRecords = records.filter((_, i) => i !== index);
            onChange(newRecords);
        }
    };

    const renderCommonFields = (record, index) => (
        <>
            <Form.Item
                label="Date"
                required
            >
                <DatePicker
                    value={record.date ? safeDayjs(record.date) : null}
                    onChange={(date) => updateRecord(index, 'date', date)}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    placeholder="Select date"
                />
            </Form.Item>

            <Form.Item
                label="Status"
            >
                <Input
                    value={record.status || ''}
                    onChange={(e) => updateRecord(index, 'status', e.target.value)}
                    placeholder="Enter status"
                />
            </Form.Item>

            <Form.Item
                label="Priority"
                required
            >
                <Select
                    value={record.priority || 2}
                    onChange={(value) => updateRecord(index, 'priority', value)}
                    placeholder="Select priority"
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
            </Form.Item>

            {/* Responsible BDM Field - Show all profiles */}
            <Form.Item
                label="Responsible BDM"
            >
                <Select
                    value={record.responsible_bdm || ''}
                    onChange={(value) => updateRecord(index, 'responsible_bdm', value)}
                    placeholder="Select responsible BDM"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >
                    {profiles.map(profile => (
                        <Option key={profile.id} value={profile.id}>
                            {profile.full_name} ({profile.email})
                        </Option>
                    ))}
                </Select>
            </Form.Item>
        </>
    );

    const renderCategorySpecificFields = (record, index) => {
        switch (category?.id) {
            case 'visit_plan':
                return (
                    <>
                        <Form.Item
                            label="Name"
                            required
                        >
                            <Input
                                value={record.name || ''}
                                onChange={(e) => updateRecord(index, 'name', e.target.value)}
                                placeholder="Enter name"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Area"
                        >
                            <Input
                                value={record.area || ''}
                                onChange={(e) => updateRecord(index, 'area', e.target.value)}
                                placeholder="Enter area"
                            />
                        </Form.Item>
                    </>
                );

            case 'meetings':
                return (
                    <>
                        <Form.Item
                            label="Subject"
                            required
                        >
                            <TextArea
                                rows={2}
                                value={record.subject || ''}
                                onChange={(e) => updateRecord(index, 'subject', e.target.value)}
                                placeholder="Enter meeting subject"
                            />
                        </Form.Item>
                    </>
                );

            case 'special_task':
                return (
                    <>
                        <Form.Item
                            label="Task"
                            required
                        >
                            <TextArea
                                rows={2}
                                value={record.task || ''}
                                onChange={(e) => updateRecord(index, 'task', e.target.value)}
                                placeholder="Enter task details"
                            />
                        </Form.Item>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {records.map((record, index) => (
                <Card
                    key={index}
                    title={`Record ${index + 1}`}
                    size="small"
                    style={{ marginBottom: 16, border: '1px solid #d9d9d9' }}
                    extra={
                        records.length > 1 && (
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeRecord(index)}
                                size="small"
                            >
                                Remove
                            </Button>
                        )
                    }
                >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {renderCommonFields(record, index)}
                        {renderCategorySpecificFields(record, index)}
                    </Space>
                </Card>
            ))}

            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addRecord}
                style={{ width: '100%' }}
            >
                Add Another Record
            </Button>

            <Alert
                message={`You are creating ${records.length} record(s) at once`}
                description="All records will be saved when you click the 'Create Records' button."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
            />
        </div>
    );
};

// Excel Import Component
const ExcelImportModal = ({ visible, onCancel, selectedCategory, onImportComplete, profiles }) => {
    const [importLoading, setImportLoading] = useState(false);
    const [uploadedData, setUploadedData] = useState([]);
    const [validationResults, setValidationResults] = useState([]);

    // Check if category has responsible_bdm column
    const hasResponsibleBDM = true; // Assuming all categories now have this field

    // Download template function
    const downloadTemplate = () => {
        try {
            if (hasResponsibleBDM) {
                toast.warning("We cannot create a template for this category because there is a mandatory column 'Responsible BDM' for assigning an employee. Use bulk records to add multiple records.");
                return;
            }

            // Create template data structure based on category
            let templateData = [];
            let headers = [];

            switch (selectedCategory?.id) {
                case 'visit_plan':
                    headers = ['Date*', 'Name*', 'Area', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Name*': 'John Doe',
                        'Area': 'North Region',
                        'Status': 'Scheduled',
                        'Priority*': '3'
                    }];
                    break;

                case 'meetings':
                    headers = ['Date*', 'Subject*', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Subject*': 'Quarterly Review',
                        'Status': 'Planned',
                        'Priority*': '2'
                    }];
                    break;

                case 'special_task':
                    headers = ['Date*', 'Task*', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Task*': 'Complete project documentation',
                        'Status': 'In Progress',
                        'Priority*': '3'
                    }];
                    break;

                default:
                    headers = ['Date*', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Status': 'Active',
                        'Priority*': '2'
                    }];
            }

            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();

            // Add instructions sheet
            const instructions = {
                'Instructions': 'Fill in the data below. Fields marked with * are required.',
                'Priority Guide': '1=Low, 2=Normal, 3=Medium, 4=High, 5=Critical',
                'Date Format': 'DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD'
            };

            const instructionSheet = XLSX.utils.json_to_sheet([instructions]);
            XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

            // Add data template sheet
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

            // Auto-size columns
            const colWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
            worksheet['!cols'] = colWidths;

            const fileName = `${selectedCategory?.name || 'cluster_6'}_import_template.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success('Template downloaded successfully!');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to download template');
        }
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const cleanDateStr = dateStr.toString().trim();

        // Try dd/mm/yyyy format first
        let date = dayjs(cleanDateStr, 'DD/MM/YYYY', true);
        if (date.isValid()) {
            return date;
        }

        // Try yyyy-mm-dd format
        date = dayjs(cleanDateStr, 'YYYY-MM-DD', true);
        if (date.isValid()) {
            return date;
        }

        // Try other common formats
        date = dayjs(cleanDateStr);
        if (date.isValid()) {
            return date;
        }

        return null;
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (hasResponsibleBDM) {
            toast.warning("Excel import is not available for categories with 'Responsible BDM' field. Use bulk records instead.");
            return false;
        }

        setImportLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first worksheet
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast.error('The uploaded file is empty');
                    setImportLoading(false);
                    return;
                }

                // Validate data
                const validatedData = validateExcelData(jsonData);
                setUploadedData(validatedData.validRows);
                setValidationResults(validatedData.results);

                if (validatedData.validRows.length === 0) {
                    toast.error('No valid data found in the uploaded file');
                } else {
                    toast.success(`Found ${validatedData.validRows.length} valid records out of ${jsonData.length}`);
                }
            } catch (error) {
                console.error('Error reading Excel file:', error);
                toast.error('Failed to read Excel file');
            } finally {
                setImportLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
        return false;
    };

    // Validate Excel data
    const validateExcelData = (data) => {
        const results = [];
        const validRows = [];

        data.forEach((row, index) => {
            const errors = [];
            const validatedRow = {};

            // Check required fields based on category
            const dateValue = row.Date || row['Date*'];
            if (!dateValue) {
                errors.push('Date is required');
            } else {
                const date = parseDate(dateValue);
                if (!date || !date.isValid()) {
                    errors.push('Invalid date format. Use DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD');
                } else {
                    validatedRow.date = date.format('YYYY-MM-DD');
                }
            }

            if (!row.Priority && !row['Priority*']) {
                errors.push('Priority is required');
            } else {
                const priority = parseInt(row.Priority || row['Priority*']);
                if (isNaN(priority) || priority < 1 || priority > 5) {
                    errors.push('Priority must be between 1-5');
                } else {
                    validatedRow.priority = priority;
                }
            }

            // Category-specific validations
            switch (selectedCategory?.id) {
                case 'visit_plan':
                    if (!row.Name && !row['Name*']) errors.push('Name is required');
                    else validatedRow.name = row.Name || row['Name*'];

                    validatedRow.area = row.Area || '';
                    break;

                case 'meetings':
                    if (!row.Subject && !row['Subject*']) errors.push('Subject is required');
                    else validatedRow.subject = row.Subject || row['Subject*'];
                    break;

                case 'special_task':
                    if (!row.Task && !row['Task*']) errors.push('Task is required');
                    else validatedRow.task = row.Task || row['Task*'];
                    break;
            }

            // Optional fields
            validatedRow.status = row.Status || 'Scheduled';

            results.push({
                row: index + 2,
                data: validatedRow,
                errors,
                isValid: errors.length === 0
            });

            if (errors.length === 0) {
                validRows.push(validatedRow);
            }
        });

        return { results, validRows };
    };

    // Import validated data
    const importData = async () => {
        if (uploadedData.length === 0) {
            toast.warning('No valid data to import');
            return;
        }

        setImportLoading(true);
        try {
            const { data, error } = await supabase
                .from(selectedCategory.table)
                .insert(uploadedData)
                .select();

            if (error) throw error;

            for (const record of data) {
                await notifyDepartmentOperation(
                    'cluster_6',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    record,
                    {
                        tableName: selectedCategory.table,
                        userId: 'excel-import',
                        source: 'excel_import'
                    }
                );
            }

            toast.success(`Successfully imported ${data.length} records`);
            onImportComplete();
            onCancel();
        } catch (error) {
            console.error('Error importing data:', error);
            toast.error('Failed to import data');
        } finally {
            setImportLoading(false);
        }
    };

    const uploadProps = {
        beforeUpload: handleFileUpload,
        accept: '.xlsx, .xls',
        showUploadList: false,
        multiple: false
    };

    return (
        <Modal
            title={
                <Space>
                    <FileExcelOutlined />
                    Import Data from Excel - {selectedCategory?.name}
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="download"
                    icon={<DownloadOutlined />}
                    onClick={downloadTemplate}
                    disabled={hasResponsibleBDM}
                >
                    Download Template
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={importData}
                    loading={importLoading}
                    disabled={uploadedData.length === 0 || hasResponsibleBDM}
                >
                    Import {uploadedData.length} Records
                </Button>
            ]}
            width={800}
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Warning Alert for Responsible BDM */}
                {hasResponsibleBDM && (
                    <Alert
                        message="Excel Template Not Available"
                        description={
                            <div>
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    We cannot create a template for this category because there is a mandatory column 'Responsible BDM' for assigning an employee.
                                </Text>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                    <li>Use 'Bulk Records' feature to add multiple records</li>
                                    <li>Bulk records allow you to assign Responsible BDM for each record</li>
                                    <li>Excel import is disabled for categories with Responsible BDM field</li>
                                </ul>
                            </div>
                        }
                        type="warning"
                        showIcon
                    />
                )}

                {/* Upload Section */}
                <Card size="small" title="Upload Excel File" style={{ display: hasResponsibleBDM ? 'none' : 'block' }}>
                    <Upload.Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <FileExcelOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Click or drag Excel file to this area to upload
                        </p>
                        <p className="ant-upload-hint">
                            Support for .xlsx, .xls files only
                        </p>
                    </Upload.Dragger>
                </Card>

                {/* Validation Results */}
                {validationResults.length > 0 && (
                    <Card
                        size="small"
                        title={`Validation Results (${uploadedData.length} valid / ${validationResults.length} total)`}
                    >
                        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                            {validationResults.map((result, index) => (
                                <Alert
                                    key={index}
                                    message={`Row ${result.row}: ${result.isValid ? 'Valid' : 'Has Errors'}`}
                                    description={
                                        result.errors.length > 0 ? (
                                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                                {result.errors.map((error, errorIndex) => (
                                                    <li key={errorIndex}>{error}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'All fields are valid'
                                        )
                                    }
                                    type={result.isValid ? 'success' : 'error'}
                                    showIcon
                                    style={{ marginBottom: 8 }}
                                    size="small"
                                />
                            ))}
                        </div>
                    </Card>
                )}

                {/* Instructions */}
                <Alert
                    message="Import Instructions"
                    description={
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                            <li>Download the template first to ensure correct format</li>
                            <li>Required fields are marked with * in the template</li>
                            <li>Date format: DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD</li>
                            <li>Priority must be a number between 1-5 (1=Low, 5=Critical)</li>
                            <li>Only valid records will be imported</li>
                        </ul>
                    }
                    type="info"
                    showIcon
                    style={{ display: hasResponsibleBDM ? 'none' : 'block' }}
                />
            </Space>
        </Modal>
    );
};

// Export Button Component with Word Export
const ExportButton = ({
    activities = [],
    selectedCategory = null,
    moduleName = '',
    priorityLabels = {}
}) => {
    const priorityOptions = [
        { value: 1, label: 'Low', color: 'green' },
        { value: 2, label: 'Normal', color: 'blue' },
        { value: 3, label: 'Medium', color: 'orange' },
        { value: 4, label: 'High', color: 'red' },
        { value: 5, label: 'Critical', color: 'purple' }
    ];

    const getPriorityLabel = (priority) => {
        const option = priorityOptions.find(opt => opt.value === priority);
        return option ? option.label : 'Normal';
    };

    /** -----------------------------
     * Export to Excel (.xlsx)
     * ----------------------------- */
    const exportToExcel = () => {
        try {
            const dataForExport = activities.map(activity => {
                const base = {
                    'Category': selectedCategory?.name || '',
                    'Priority': getPriorityLabel(activity.priority),
                    'Date': activity.date
                        ? dayjs(activity.date).format('YYYY-MM-DD')
                        : '',
                    'Status': activity.status || '',
                    'Created Date': activity.created_at
                        ? dayjs(activity.created_at).format('YYYY-MM-DD')
                        : ''
                };

                switch (selectedCategory?.id) {
                    case 'meetings':
                        return {
                            ...base,
                            'Subject': activity.subject || ''
                        };

                    case 'visit_plan':
                        return {
                            ...base,
                            'Name': activity.name || '',
                            'Area': activity.area || ''
                        };

                    case 'special_task':
                        return {
                            ...base,
                            'Task': activity.task || ''
                        };

                    default:
                        return base;
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cluster 6 Export');

            // Auto-size columns
            const colWidths = [];
            if (dataForExport.length > 0) {
                Object.keys(dataForExport[0]).forEach(key => {
                    const maxLength = Math.max(
                        key.length,
                        ...dataForExport.map(row => String(row[key] || '').length)
                    );
                    colWidths.push({ wch: Math.min(maxLength + 2, 50) });
                });
                worksheet['!cols'] = colWidths;
            }

            const fileName = `${selectedCategory?.name || 'cluster_6_export'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            toast.success(`Excel file exported successfully! (${dataForExport.length} records)`);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    /** -----------------------------
     * Export to Word (.docx)
     * ----------------------------- */
    const exportToWord = async () => {
        try {
            // Create table rows
            const tableRows = activities.map((activity, index) => {
                const cells = [];

                // Add basic information cells
                cells.push(
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun(String(index + 1))] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun(selectedCategory?.name || '')] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun(getPriorityLabel(activity.priority))] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun(activity.date ? dayjs(activity.date).format('DD/MM/YYYY') : '')] })]
                    }),
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun(activity.status || '')] })]
                    })
                );

                // Add category-specific cells
                switch (selectedCategory?.id) {
                    case 'meetings':
                        cells.push(
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun(activity.subject || '')] })]
                            })
                        );
                        break;
                    case 'visit_plan':
                        cells.push(
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun(activity.name || '')] })]
                            }),
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun(activity.area || '')] })]
                            })
                        );
                        break;
                    case 'special_task':
                        cells.push(
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun(activity.task || '')] })]
                            })
                        );
                        break;
                }

                return new TableRow({ children: cells });
            });

            // Create headers
            const headers = ['#', 'Category', 'Priority', 'Date', 'Status'];
            switch (selectedCategory?.id) {
                case 'meetings':
                    headers.push('Subject');
                    break;
                case 'visit_plan':
                    headers.push('Name', 'Area');
                    break;
                case 'special_task':
                    headers.push('Task');
                    break;
            }

            const headerRow = new TableRow({
                children: headers.map(header => 
                    new TableCell({
                        children: [new Paragraph({ 
                            children: [new TextRun({ 
                                text: header, 
                                bold: true 
                            })] 
                        })]
                    })
                )
            });

            // Create document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Cluster 6 Export - ${selectedCategory?.name}`,
                                    bold: true,
                                    size: 32
                                })
                            ],
                            alignment: "center"
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Generated on: ${dayjs().format('DD/MM/YYYY HH:mm')}`,
                                    italics: true
                                })
                            ],
                            alignment: "center"
                        }),
                        new Paragraph({ children: [new TextRun("")] }), // Empty line
                        new DocTable({
                            width: {
                                size: 100,
                                type: WidthType.PERCENTAGE,
                            },
                            rows: [headerRow, ...tableRows],
                        })
                    ]
                }]
            });

            // Generate and download
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedCategory?.name || 'cluster_6_export'}_${dayjs().format('YYYY-MM-DD')}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Word document exported successfully! (${activities.length} records)`);
        } catch (error) {
            console.error('Error exporting Word document:', error);
            toast.error('Failed to export Word document');
        }
    };

    /** -----------------------------
     * Dropdown menu
     * ----------------------------- */
    const exportItems = [
        {
            key: 'excel',
            icon: <FileExcelOutlined />,
            label: 'Export to Excel',
            onClick: exportToExcel
        },
        {
            key: 'word',
            icon: <FileWordOutlined />,
            label: 'Export to Word',
            onClick: exportToWord
        }
    ];

    return (
        <Dropdown
            menu={{ items: exportItems }}
            placement="bottomRight"
            disabled={activities.length === 0}
        >
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                disabled={activities.length === 0}
            >
                Export
            </Button>
        </Dropdown>
    );
};

const Cluster6 = () => {
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

    // Bulk mode states
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkRecords, setBulkRecords] = useState([{}]);

    // View mode state (web view or excel view)
    const [viewMode, setViewMode] = useState('web');

    // User Availability States
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [cluster6Users, setCluster6Users] = useState([]);
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

    // Excel Import Modal State
    const [excelImportModalVisible, setExcelImportModalVisible] = useState(false);

    // Cluster 6 Categories configuration
    const cluster6Categories = [
        {
            id: 'visit_plan',
            name: 'Visit Plan',
            table: 'cluster_6_visit_plan',
            type: 'Visit Plan',
            icon: <UserOutlined />,
            dateField: 'date',
            color: '#1890ff',
            hasTimeFields: false
        },
        {
            id: 'meetings',
            name: 'Meetings',
            table: 'cluster_6_meetings',
            type: 'Meeting',
            icon: <TeamOutlined />,
            dateField: 'date',
            color: '#fa8c16',
            hasTimeFields: false
        },
        {
            id: 'special_task',
            name: 'Special Task',
            table: 'cluster_6_special_task',
            type: 'Special Task',
            icon: <SafetyCertificateOutlined />,
            dateField: 'date',
            color: '#52c41a',
            hasTimeFields: false
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
        initializeCluster6();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshCluster6Data();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshCluster6Data = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.info('Cluster 6 data updated automatically');
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
            toast.success('Cluster 6 data refreshed successfully');
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

    // Initialize Cluster 6 module
    const initializeCluster6 = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchProfiles(),
                fetchCluster6Users()
            ]);

            // Set default date range after initialization
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'initializing Cluster 6 module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeCluster6();
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

    const fetchCluster6Users = async () => {
        try {
            // Get Cluster 6 department ID
            const { data: deptData, error: deptError } = await supabase
                .from('departments')
                .select('id')
                .eq('name', 'Cluster 6')
                .single();

            if (deptError) {
                // Try case-insensitive search
                const { data: deptDataAlt, error: deptErrorAlt } = await supabase
                    .from('departments')
                    .select('id')
                    .ilike('name', '%Cluster 6%')
                    .single();

                if (deptErrorAlt) throw deptErrorAlt;
                if (!deptDataAlt) {
                    toast.warning('Cluster 6 department not found. Using all users as fallback.');
                    const { data: allUsers, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, department_id')
                        .order('full_name');

                    if (usersError) throw usersError;
                    safeSetState(setCluster6Users, allUsers || []);
                    return;
                }

                safeSetState(setCluster6Users, []);
                return;
            }

            if (!deptData) {
                toast.warning('Cluster 6 department not found');
                safeSetState(setCluster6Users, []);
                return;
            }

            // Get all users in Cluster 6 department
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, department_id')
                .eq('department_id', deptData.id)
                .order('full_name');

            if (usersError) throw usersError;
            safeSetState(setCluster6Users, usersData || []);
        } catch (error) {
            handleError(error, 'fetching Cluster 6 users');
            safeSetState(setCluster6Users, []);
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
                .order('priority', { ascending: false })
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
                'visit_plan': 'cluster_6_visit_plan_fb',
                'meetings': 'cluster_6_meetings_fb',
                'special_task': 'cluster_6_special_task_fb'
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

            let allActivities = [];

            // Get user details
            const user = cluster6Users.find(u => u.id === userId);
            if (!user) {
                console.warn('User not found in Cluster 6 users list');
                safeSetState(setUserSchedule, []);
                return;
            }

            const userName = user.full_name || user.email;
            console.log(`Fetching schedule for user: ${userName} (${userId})`);

            // 1. Personal meetings for the specific user
            const { data: personalMeetings, error: personalError } = await supabase
                .from('personal_meetings')
                .select('*')
                .eq('user_id', userId)
                .gte('start_date', formattedStart)
                .lte('end_date', formattedEnd)
                .order('priority', { ascending: false })
                .order('start_date', { ascending: true });

            if (personalError) console.error('Personal meetings error:', personalError);

            // 2. Cluster 6 activities
            for (const category of cluster6Categories) {
                console.log(`Checking category: ${category.name}`);

                let query = supabase
                    .from(category.table)
                    .select('*')
                    .gte(category.dateField, formattedStart)
                    .lte(category.dateField, formattedEnd)
                    .order('priority', { ascending: false })
                    .order(category.dateField, { ascending: true });

                let categoryActivities = [];

                try {
                    const { data } = await query;
                    if (data) {
                        categoryActivities = data;
                    }

                    console.log(`Category ${category.name} activities:`, categoryActivities.length);

                    if (categoryActivities.length > 0) {
                        allActivities.push(...categoryActivities.map(activity => ({
                            ...activity,
                            type: 'cluster_6_activity',
                            activity_type: category.name,
                            source_table: category.table,
                            category_id: category.id
                        })));
                    }

                } catch (categoryError) {
                    console.error(`Error fetching ${category.name}:`, categoryError);
                }
            }

            // Combine all activities
            const userSchedule = [
                ...(personalMeetings || []).map(meeting => ({
                    ...meeting,
                    type: 'personal_meeting',
                    category_id: 'personal_meeting'
                })),
                ...allActivities
            ];

            console.log('Total schedule items:', userSchedule.length);
            safeSetState(setUserSchedule, userSchedule);

        } catch (error) {
            console.error('Error in fetchUserSchedule:', error);
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
            safeSetState(setViewMode, 'web');
            safeSetState(setBulkMode, false);
            safeSetState(setBulkRecords, [{}]);
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

            // Initialize bulk records if in bulk mode
            if (bulkMode) {
                safeSetState(setBulkRecords, [{}]);
            }

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
                if (record.date) {
                    formattedRecord.date = safeDayjs(record.date);
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

            await notifyDepartmentOperation(
                'cluster_6',
                selectedCategory.name,
                NOTIFICATION_TYPES.DELETE,
                record,
                {
                    tableName: selectedCategory.table,
                    userId: currentUser?.id
                }
            );

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

    const handleBulkCreate = async (records) => {
        try {
            if (!selectedCategory?.table) {
                throw new Error('No category selected');
            }

            if (!records || records.length === 0) {
                toast.warning('No records to create');
                return;
            }

            // Validate records
            const validRecords = records.filter(record => {
                if (!record.date) return false;

                switch (selectedCategory.id) {
                    case 'visit_plan':
                        return record.name;
                    case 'meetings':
                        return record.subject;
                    case 'special_task':
                        return record.task;
                    default:
                        return true;
                }
            });

            if (validRecords.length === 0) {
                toast.error('Please fill in all required fields for at least one record');
                return;
            }

            if (validRecords.length !== records.length) {
                toast.warning(`Only ${validRecords.length} out of ${records.length} records are valid and will be created`);
            }

            setLoading(true);

            // Prepare data for submission
            const submitData = validRecords.map(record => {
                const preparedRecord = { ...record };

                // Convert dayjs objects to proper formats
                Object.keys(preparedRecord).forEach(key => {
                    try {
                        const value = preparedRecord[key];
                        if (dayjs.isDayjs(value)) {
                            preparedRecord[key] = value.format('YYYY-MM-DD');
                        }
                    } catch (dateError) {
                        console.warn(`Error converting date field ${key}:`, dateError);
                    }
                });

                return preparedRecord;
            });

            // Insert all records
            const { data, error } = await supabase
                .from(selectedCategory.table)
                .insert(submitData)
                .select();

            if (error) throw error;

            // Send notifications for each created record
            for (const record of data) {
                await notifyDepartmentOperation(
                    'cluster_6',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    record,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );
            }

            toast.success(`Successfully created ${data.length} record(s)`);

            // Reset and close
            setModalVisible(false);
            setBulkRecords([{}]);
            fetchTableData();

        } catch (error) {
            handleError(error, 'bulk creating records');
        } finally {
            setLoading(false);
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

    const handleExcelImportClick = () => {
        try {
            if (!selectedCategory) {
                toast.warning('Please select a category first');
                return;
            }
            safeSetState(setExcelImportModalVisible, true);
        } catch (error) {
            handleError(error, 'opening Excel import');
        }
    };

    const handleExcelImportComplete = () => {
        fetchTableData();
    };

    const handleFormSubmit = async (values) => {
        try {
            if (!selectedCategory?.table) {
                throw new Error('No category selected');
            }

            // Prepare data for submission
            const submitData = { ...values };

            // Convert dayjs objects to proper formats with error handling
            Object.keys(submitData).forEach(key => {
                try {
                    const value = submitData[key];
                    if (dayjs.isDayjs(value)) {
                        submitData[key] = value.format('YYYY-MM-DD');
                    }
                } catch (dateError) {
                    console.warn(`Error converting date field ${key}:`, dateError);
                }
            });

            let result;

            if (editingRecord) {
                // Update existing record
                const { data, error } = await supabase
                    .from(selectedCategory.table)
                    .update(submitData)
                    .eq('id', editingRecord.id)
                    .select();

                if (error) throw error;
                result = data[0];

                await notifyDepartmentOperation(
                    'cluster_6',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.UPDATE,
                    result,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );

                toast.success('Record updated successfully');
            } else {
                // Create new record
                const { data, error } = await supabase
                    .from(selectedCategory.table)
                    .insert([submitData])
                    .select();

                if (error) throw error;
                result = data[0];

                await notifyDepartmentOperation(
                    'cluster_6',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    result,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );

                toast.success('Record created successfully');
            }

            safeSetState(setModalVisible, false);
            fetchTableData();
        } catch (error) {
            handleError(error, 'saving record');
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

            const responsibleBDMColumn = {
                title: 'Responsible BDM',
                dataIndex: 'responsible_bdm',
                key: 'responsible_bdm',
                width: 150,
                render: (bdmId) => {
                    const profile = profiles.find(p => p.id === bdmId);
                    return profile ? profile.full_name : 'Not assigned';
                }
            };

            switch (selectedCategory.id) {
                case 'visit_plan':
                    return [
                        priorityColumn,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
                        { title: 'Area', dataIndex: 'area', key: 'area', width: 120 },
                        responsibleBDMColumn,
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                        actionColumn
                    ];

                case 'meetings':
                    return [
                        priorityColumn,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Subject', dataIndex: 'subject', key: 'subject', width: 200 },
                        responsibleBDMColumn,
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                        actionColumn
                    ];

                case 'special_task':
                    return [
                        priorityColumn,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Task', dataIndex: 'task', key: 'task', width: 200 },
                        responsibleBDMColumn,
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                        actionColumn
                    ];

                default:
                    return [];
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
                        name="date"
                        label="Date"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            placeholder="Select date"
                        />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                    >
                        <Input placeholder="Enter status" />
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

                    {/* Responsible BDM Field - Show all profiles */}
                    <Form.Item
                        name="responsible_bdm"
                        label="Responsible BDM"
                    >
                        <Select
                            placeholder="Select responsible BDM"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                        >
                            {profiles.map(profile => (
                                <Option key={profile.id} value={profile.id}>
                                    {profile.full_name} ({profile.email})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </>
            );

            switch (selectedCategory.id) {
                case 'visit_plan':
                    return (
                        <>
                            {commonFields}
                            <Form.Item
                                name="name"
                                label="Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input placeholder="Enter name" />
                            </Form.Item>
                            <Form.Item
                                name="area"
                                label="Area"
                            >
                                <Input placeholder="Enter area" />
                            </Form.Item>
                        </>
                    );

                case 'meetings':
                    return (
                        <>
                            {commonFields}
                            <Form.Item
                                name="subject"
                                label="Subject"
                                rules={[{ required: true, message: 'Please enter subject' }]}
                            >
                                <TextArea rows={3} placeholder="Enter meeting subject" />
                            </Form.Item>
                        </>
                    );

                case 'special_task':
                    return (
                        <>
                            {commonFields}
                            <Form.Item
                                name="task"
                                label="Task"
                                rules={[{ required: true, message: 'Please enter task details' }]}
                            >
                                <TextArea rows={3} placeholder="Enter task details" />
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
        return <LoadingSpinner tip="Loading Cluster 6 module..." />;
    }

    const stats = getStats();

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="Cluster 6 Module Error"
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
                style={{
                    marginBottom: 16,
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '2px solid #1890ff20'
                }}
                bodyStyle={{ padding: '12px 16px' }}
            >
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                            <SafetyCertificateOutlined /> Cluster 6 Department
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
                    description="Cluster 6 data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Category Cards */}
            <Card
                title="Cluster 6 Categories"
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color="blue">
                        {cluster6Categories.length} Categories Available
                    </Tag>
                }
            >
                <Row gutter={[16, 16]}>
                    {cluster6Categories.map((category) => (
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

            {/* View Mode Selection and Date Range Filter */}
            {selectedCategory && (
                <Card
                    title={
                        <Space>
                            <FilterOutlined />
                            Filter Data & View Options
                            <Tag color="blue">
                                Default: {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                            </Tag>
                        </Space>
                    }
                    style={{ marginBottom: 24 }}
                    extra={
                        <Space>
                            <Radio.Group
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value)}
                                buttonStyle="solid"
                            >
                                <Radio.Button value="web">
                                    <AppstoreOutlined /> Web View
                                </Radio.Button>
                                <Radio.Button value="excel">
                                    <FileExcelOutlined /> Excel View
                                </Radio.Button>
                            </Radio.Group>

                            {/* Bulk Mode Toggle */}
                            <Switch
                                checkedChildren="Multiple"
                                unCheckedChildren="Single"
                                checked={bulkMode}
                                onChange={(checked) => {
                                    setBulkMode(checked);
                                    if (checked) {
                                        setBulkRecords([{}]);
                                    }
                                }}
                            />

                            {/* Excel Import Button */}
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={handleExcelImportClick}
                                size="large"
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Upload Excel
                            </Button>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                loading={loading}
                                size="large"
                            >
                                Add New Record{bulkMode ? 's (Multiple)' : ''}
                            </Button>
                        </Space>
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
                    <Cluster6Statistics stats={stats} loading={loading} />

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

            {/* Data Table or Export Button */}
            {selectedCategory && dateRange[0] && dateRange[1] && (
                <Card
                    title={
                        <Space>
                            {selectedCategory.icon}
                            {selectedCategory.name} Data - {viewMode === 'web' ? 'Web View' : 'Excel View'}
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
                            {viewMode === 'excel' && (
                                <ExportButton
                                    activities={tableData}
                                    selectedCategory={selectedCategory}
                                    moduleName={selectedCategory.table}
                                    priorityLabels={Object.fromEntries(
                                        priorityOptions.map(opt => [opt.value, opt.label])
                                    )}
                                />
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
                                    <div>
                                        <Button type="primary" onClick={handleCreate} style={{ marginRight: 8 }}>
                                            <PlusOutlined /> Create First Record
                                        </Button>
                                        <Button
                                            type="default"
                                            icon={<UploadOutlined />}
                                            onClick={handleExcelImportClick}
                                        >
                                            Upload Excel Data
                                        </Button>
                                    </div>
                                </Space>
                            }
                        />
                    ) : viewMode === 'web' ? (
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
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                            <Title level={4}>Ready to Export Data</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                                Use the Export dropdown button above to download {tableData.length} records in Excel or Word format.
                            </Text>
                            <Alert
                                message="Excel View Mode"
                                description="In Excel View mode, you can export the data to XLSX or Word format for offline analysis. Switch to Web View for editing, deleting, and discussion features."
                                type="info"
                                showIcon
                            />
                        </div>
                    )}
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingRecord ? <EditOutlined /> : <PlusOutlined />}
                        {editingRecord ? 'Edit' : bulkMode ? 'Create Multiple' : 'Create'} {selectedCategory?.name} Record
                        {bulkMode && !editingRecord && (
                            <Tag color="orange">Bulk Mode: {bulkRecords.length} records</Tag>
                        )}
                    </Space>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setBulkRecords([{}]);
                }}
                footer={null}
                width={bulkMode && !editingRecord ? 800 : 600}
                destroyOnClose
            >
                {editingRecord ? (
                    // Single Edit Mode
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
                                    Update Record
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                ) : bulkMode ? (
                    // Bulk Create Mode
                    <div>
                        <BulkFormFields
                            records={bulkRecords}
                            onChange={setBulkRecords}
                            category={selectedCategory}
                            priorityOptions={priorityOptions}
                            safeDayjs={safeDayjs}
                            profiles={profiles}
                        />
                        <Divider />
                        <div style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    onClick={() => {
                                        setModalVisible(false);
                                        setBulkRecords([{}]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => handleBulkCreate(bulkRecords)}
                                    size="large"
                                    loading={loading}
                                >
                                    Create {bulkRecords.length} Record{bulkRecords.length > 1 ? 's' : ''}
                                </Button>
                            </Space>
                        </div>
                    </div>
                ) : (
                    // Single Create Mode
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
                                    Create Record
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* Excel Import Modal */}
            <ExcelImportModal
                visible={excelImportModalVisible}
                onCancel={() => setExcelImportModalVisible(false)}
                selectedCategory={selectedCategory}
                onImportComplete={handleExcelImportComplete}
                profiles={profiles}
            />

            {/* User Availability Modal */}
            <Modal
                title={
                    <Space>
                        <UserOutlined />
                        Check Cluster 6 Team Availability
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

                    {/* Cluster 6 Users List */}
                    <Card size="small" title="Cluster 6 Team Members">
                        {cluster6Users.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No Cluster 6 team members found"
                            />
                        ) : (
                            <List
                                dataSource={cluster6Users}
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
                                                    text="Cluster 6 Team Member"
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
                <Card title="How to Use Cluster 6 Module" style={{ borderRadius: '12px' }}>
                    <Alert
                        message="Manage Cluster 6 Department Data"
                        description={
                            <div>
                                <Text strong>Follow these steps:</Text>
                                <ol>
                                    <li>Click on any category card above to select a data type</li>
                                    <li>Choose between Web View (for editing/discussion) or Excel View (for export)</li>
                                    <li>Date range is automatically set to yesterday to 9 days from today</li>
                                    <li>Use priority filter to view high-priority items first</li>
                                    <li>In Web View: Use Edit/Delete actions and Discuss features</li>
                                    <li>In Excel View: Export data to XLSX or Word for offline analysis</li>
                                    <li>Red badge on Discuss button shows unread messages</li>
                                    <li>Use "Check Team Availability" to view team schedules</li>
                                    <li>Enable auto-refresh for automatic data updates every 2 minutes</li>
                                    <li>Use the Single/Multiple toggle to switch between single and bulk record creation</li>
                                    <li>Use "Upload Excel" to import data from Excel files (when available)</li>
                                    <li>Responsible BDM field now shows all profiles from the system</li>
                                </ol>
                                <Text type="secondary">
                                    Each category represents different Cluster 6 activities recorded in the system.
                                    Web View provides full interactive features while Excel View is for read-only data export.
                                    Bulk mode allows creating multiple records at once for better productivity.
                                    Excel import is disabled for categories with Responsible BDM field - use bulk records instead.
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

export default Cluster6;
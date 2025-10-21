import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Button, Row, Col, Typography, Table, DatePicker,
    Space, Tag, Statistic, Alert, Spin, Modal, Form, Input,
    Select, InputNumber, message, Popconfirm, Divider, List,
    Tooltip, Badge, Timeline, Empty, Result, Descriptions,
    Tabs, Switch, Pagination, Progress, Rate, TimePicker, Radio, Dropdown
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
    RocketOutlined, CodeOutlined, FileSearchOutlined, BuildOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { notifyDepartmentOperation, NOTIFICATION_TYPES } from '../../services/notifications';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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
        title="Something went wrong in HiTech Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading HiTech data..." }) => (
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
const HiTechStatistics = ({ stats, loading = false }) => (
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
                    title="Technical Tasks"
                    value={stats?.technicalTasks || 0}
                    prefix={<CodeOutlined />}
                    valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Validation Tasks"
                    value={stats?.validationTasks || 0}
                    prefix={<FileSearchOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Active Projects"
                    value={stats?.activeProjects || 0}
                    prefix={<RocketOutlined />}
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

    // Get the correct feedback table name for HiTech
    const getFeedbackTable = useCallback(() => {
        if (!category) return null;

        const tableMap = {
            'page_generation': 'hitech_page_generation_fb',
            'technical_discussions': 'hitech_technical_discussions_fb',
            'tender_validation': 'hitech_tender_validation_fb',
            'visit_plan': 'hitech_visit_plan_fb'
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
                'hitech',
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
                    Discussion: {record?.sp_name || record?.name || record?.promotional_activity || 'Record'}
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
                case 'hitech_activity':
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
                case 'hitech_activity':
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
            if (item.type === 'hitech_activity') return `HiTech ${item.activity_type}`;
            return 'Unknown Activity';
        } catch (error) {
            return 'Unknown Activity';
        }
    };

    const getActivityDescription = (item) => {
        try {
            if (item.type === 'personal_meeting') {
                return item.description || 'No description available';
            }
            if (item.type === 'hitech_activity') {
                return item.purpose || item.remarks || item.model || 'No description available';
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
                                                {item.sp_name || item.name || item.promotional_activity || 'Unknown Activity'}
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

                                        {item.company && (
                                            <Descriptions.Item label="Company">
                                                {item.company}
                                            </Descriptions.Item>
                                        )}
                                        {item.institute && (
                                            <Descriptions.Item label="Institute">
                                                <Tag color="blue">{item.institute}</Tag>
                                            </Descriptions.Item>
                                        )}
                                        {item.model && (
                                            <Descriptions.Item label="Model">
                                                <Tag color="green">{item.model}</Tag>
                                            </Descriptions.Item>
                                        )}
                                        {item.type && (
                                            <Descriptions.Item label="Type">
                                                <Tag color="orange">{item.type}</Tag>
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

// Export Button Component
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
                // Common structure for HiTech modules
                const base = {
                    'Category': selectedCategory?.name || '',
                    'Priority': getPriorityLabel(activity.priority),
                    'SP Name': activity.sp_name || '',
                    'Company': activity.company || '',
                    'Created Date': activity.created_at
                        ? dayjs(activity.created_at).format('YYYY-MM-DD')
                        : ''
                };

                // Extend base based on table type
                switch (selectedCategory?.id) {
                    case 'page_generation':
                        return {
                            ...base,
                            'Institute': activity.institute || '',
                            'Model': activity.model || ''
                        };

                    case 'technical_discussions':
                        return {
                            ...base,
                            'Promotional Activity': activity.promotional_activity || '',
                            'Type': activity.type || '',
                            'Remarks': activity.remarks || ''
                        };

                    case 'tender_validation':
                        return {
                            ...base,
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Institute': activity.institute || '',
                            'Model': activity.model || ''
                        };

                    case 'visit_plan':
                        return {
                            ...base,
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Name': activity.name || '',
                            'Institute': activity.institute || '',
                            'Purpose': activity.purpose || ''
                        };

                    default:
                        return base;
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'HiTech Export');

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

            const fileName = `${selectedCategory?.name || 'hitech_export'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            toast.success(`Excel file exported successfully! (${dataForExport.length} records)`);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    /** -----------------------------
     * Export to PDF (.pdf)
     * ----------------------------- */
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(16);
            doc.text('HiTech Export Summary', 14, 15);
            doc.setFontSize(10);
            const categoryText = selectedCategory ? `Category: ${selectedCategory.name}` : '';
            doc.text(`${categoryText} | ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 22);

            const headers = ['Category', 'SP Name', 'Company', 'Priority'];
            const tableData = activities.map(a => [
                selectedCategory?.name || '',
                a.sp_name || a.name || '',
                a.company || '',
                getPriorityLabel(a.priority)
            ]);

            let y = 35;
            const xStart = 14;
            const colWidths = [40, 50, 50, 30];
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;

            // Header background
            doc.setFillColor(41, 128, 185);
            doc.setTextColor(255, 255, 255);
            let x = xStart;
            headers.forEach((header, i) => {
                doc.rect(x, y - 5, colWidths[i], 8, 'F');
                doc.text(header, x + 2, y);
                x += colWidths[i];
            });

            doc.setTextColor(0, 0, 0);
            y += 10;

            // Rows
            tableData.forEach(row => {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = 20;
                }
                x = xStart;
                row.forEach((cell, i) => {
                    doc.text(cell.toString().substring(0, 35), x + 2, y);
                    x += colWidths[i];
                });
                y += lineHeight;
            });

            const fileName = `${selectedCategory?.name || 'hitech_export'}_${dayjs().format('YYYY-MM-DD')}.pdf`;

            doc.save(fileName);
            toast.success('PDF file exported successfully!');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.error('Failed to export PDF file');
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
            key: 'pdf', 
            icon: <FilePdfOutlined />, 
            label: 'Export to PDF', 
            onClick: exportToPDF 
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

const HiTech = () => {
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

    // View mode state (web view or excel view)
    const [viewMode, setViewMode] = useState('web'); // 'web' or 'excel'

    // User Availability States
    const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
    const [hitechUsers, setHiTechUsers] = useState([]);
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

    // HiTech Categories configuration
    const hitechCategories = [
        {
            id: 'page_generation',
            name: 'Page Generation',
            table: 'hitech_page_generation',
            type: 'Technical',
            icon: <CodeOutlined />,
            dateField: 'created_at',
            color: '#1890ff',
            hasTimeFields: false
        },
        {
            id: 'technical_discussions',
            name: 'Technical Discussions',
            table: 'hitech_technical_discussions',
            type: 'Technical',
            icon: <BuildOutlined />,
            dateField: 'created_at',
            color: '#fa8c16',
            hasTimeFields: false
        },
        {
            id: 'tender_validation',
            name: 'Tender Validation',
            table: 'hitech_tender_validation',
            type: 'Validation',
            icon: <FileSearchOutlined />,
            dateField: 'date',
            color: '#52c41a',
            hasTimeFields: false
        },
        {
            id: 'visit_plan',
            name: 'Visit Plan',
            table: 'hitech_visit_plan',
            type: 'Field Work',
            icon: <RocketOutlined />,
            dateField: 'date',
            color: '#722ed1',
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
        initializeHiTech();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshHiTechData();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshHiTechData = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.info('HiTech data updated automatically');
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
            toast.success('HiTech data refreshed successfully');
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

    // Initialize HiTech module
    const initializeHiTech = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchProfiles(),
                fetchHiTechUsers()
            ]);

            // Set default date range after initialization
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'initializing HiTech module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeHiTech();
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

    const fetchHiTechUsers = async () => {
        try {
            // Use the specific HiTech department ID you provided
            const hitechDepartmentId = '7483633e-a502-4eab-8828-a9d7a6649394';
            
            // Get all users in HiTech department
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('id, full_name, email, department_id')
                .eq('department_id', hitechDepartmentId)
                .order('full_name');

            if (usersError) {
                console.error('Error fetching HiTech users:', usersError);
                // Fallback to all users if department not found
                const { data: allUsers, error: allUsersError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, department_id')
                    .order('full_name');

                if (allUsersError) throw allUsersError;
                safeSetState(setHiTechUsers, allUsers || []);
                toast.warning('Using all users as fallback for HiTech department');
                return;
            }

            safeSetState(setHiTechUsers, usersData || []);
        } catch (error) {
            handleError(error, 'fetching HiTech users');
            safeSetState(setHiTechUsers, []);
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
                .select('*');

            // Apply date filtering based on category
            if (selectedCategory.dateField === 'created_at') {
                query = query
                    .gte('created_at', `${startDate}T00:00:00Z`)
                    .lte('created_at', `${endDate}T23:59:59Z`);
            } else {
                query = query
                    .gte(selectedCategory.dateField, startDate)
                    .lte(selectedCategory.dateField, endDate);
            }

            // Apply priority filter if selected
            if (priorityFilter) {
                query = query.eq('priority', priorityFilter);
            }

            query = query.order('priority', { ascending: false })
                        .order(selectedCategory.dateField, { ascending: true });

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
                'page_generation': 'hitech_page_generation_fb',
                'technical_discussions': 'hitech_technical_discussions_fb',
                'tender_validation': 'hitech_tender_validation_fb',
                'visit_plan': 'hitech_visit_plan_fb'
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
            const user = hitechUsers.find(u => u.id === userId);
            if (!user) {
                console.warn('User not found in HiTech users list');
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

            // 2. HiTech activities
            for (const category of hitechCategories) {
                console.log(`Checking category: ${category.name}`);

                let query = supabase
                    .from(category.table)
                    .select('*');

                // Apply date filtering based on category
                if (category.dateField === 'created_at') {
                    query = query
                        .gte('created_at', `${formattedStart}T00:00:00Z`)
                        .lte('created_at', `${formattedEnd}T23:59:59Z`);
                } else {
                    query = query
                        .gte(category.dateField, formattedStart)
                        .lte(category.dateField, formattedEnd);
                }

                query = query.order('priority', { ascending: false })
                            .order(category.dateField, { ascending: true });

                let categoryActivities = [];

                try {
                    // Get all activities for this category
                    const { data } = await query;
                    if (data) {
                        // For HiTech, we'll include all activities since there's no specific user assignment
                        categoryActivities = data;
                    }

                    console.log(`Category ${category.name} activities:`, categoryActivities.length);

                    // Add category info to activities
                    if (categoryActivities.length > 0) {
                        allActivities.push(...categoryActivities.map(activity => ({
                            ...activity,
                            type: 'hitech_activity',
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
            safeSetState(setViewMode, 'web'); // Reset to web view when category changes
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
                'hitech',
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
                        // Convert date to YYYY-MM-DD format
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
                    'hitech',
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
                    'hitech',
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



            switch (selectedCategory.id) {
                case 'page_generation':
                    return [

                        { title: 'SP Name', dataIndex: 'sp_name', key: 'sp_name', width: 150 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'Institute', dataIndex: 'institute', key: 'institute', width: 150 },
                        { title: 'Model', dataIndex: 'model', key: 'model', width: 120 },
                        actionColumn
                    ];

                case 'technical_discussions':
                    return [

                        { title: 'SP Name', dataIndex: 'sp_name', key: 'sp_name', width: 150 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'Promotional Activity', dataIndex: 'promotional_activity', key: 'promotional_activity', width: 200 },
                        { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 200 },
                        actionColumn
                    ];

                case 'tender_validation':
                    return [

                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'SP Name', dataIndex: 'sp_name', key: 'sp_name', width: 150 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'Institute', dataIndex: 'institute', key: 'institute', width: 150 },
                        { title: 'Model', dataIndex: 'model', key: 'model', width: 120 },
                        actionColumn
                    ];

                case 'visit_plan':
                    return [

                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
                        { title: 'Institute', dataIndex: 'institute', key: 'institute', width: 150 },
                        { title: 'Purpose', dataIndex: 'purpose', key: 'purpose', width: 200 },
                        actionColumn
                    ];

                default:
                    return ;
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
                        name="sp_name"
                        label="SP Name"
                        rules={[{ required: true, message: 'Please enter SP Name' }]}
                    >
                        <Input placeholder="Enter SP Name" />
                    </Form.Item>

                    <Form.Item
                        name="company"
                        label="Company"
                        rules={[{ required: true, message: 'Please enter company' }]}
                    >
                        <Input placeholder="Enter company" />
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

            switch (selectedCategory.id) {
                case 'page_generation':
                    return (
                        <>
                            {commonFields}
                            <Form.Item
                                name="institute"
                                label="Institute"
                            >
                                <Input placeholder="Enter institute" />
                            </Form.Item>
                            <Form.Item
                                name="model"
                                label="Model"
                            >
                                <Input placeholder="Enter model" />
                            </Form.Item>
                        </>
                    );

                case 'technical_discussions':
                    return (
                        <>
                            {commonFields}
                            <Form.Item
                                name="promotional_activity"
                                label="Promotional Activity"
                                rules={[{ required: true, message: 'Please enter promotional activity' }]}
                            >
                                <Input placeholder="Enter promotional activity" />
                            </Form.Item>
                            <Form.Item
                                name="type"
                                label="Type"
                            >
                                <Input placeholder="Enter type" />
                            </Form.Item>
                            <Form.Item
                                name="remarks"
                                label="Remarks"
                            >
                                <TextArea rows={3} placeholder="Enter remarks" />
                            </Form.Item>
                        </>
                    );

                case 'tender_validation':
                    return (
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
                            {commonFields}
                            <Form.Item
                                name="institute"
                                label="Institute"
                            >
                                <Input placeholder="Enter institute" />
                            </Form.Item>
                            <Form.Item
                                name="model"
                                label="Model"
                            >
                                <Input placeholder="Enter model" />
                            </Form.Item>
                        </>
                    );

                case 'visit_plan':
                    return (
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
                                name="name"
                                label="Name"
                                rules={[{ required: true, message: 'Please enter name' }]}
                            >
                                <Input placeholder="Enter name" />
                            </Form.Item>
                            <Form.Item
                                name="institute"
                                label="Institute"
                            >
                                <Input placeholder="Enter institute" />
                            </Form.Item>
                            <Form.Item
                                name="purpose"
                                label="Purpose"
                                rules={[{ required: true, message: 'Please enter purpose' }]}
                            >
                                <TextArea rows={3} placeholder="Enter purpose" />
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

    const getStats = () => {
        try {
            if (!selectedCategory || !tableData.length) {
                return { 
                    totalRecords: 0, 
                    technicalTasks: 0, 
                    validationTasks: 0, 
                    activeProjects: 0 
                };
            }

            const totalRecords = tableData.length;
            
            // Calculate category-specific stats
            const technicalTasks = tableData.filter(item => 
                selectedCategory.id === 'page_generation' || 
                selectedCategory.id === 'technical_discussions'
            ).length;

            const validationTasks = tableData.filter(item => 
                selectedCategory.id === 'tender_validation'
            ).length;

            const activeProjects = tableData.filter(item => 
                selectedCategory.id === 'visit_plan'
            ).length;

            return { totalRecords, technicalTasks, validationTasks, activeProjects };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return { totalRecords: 0, technicalTasks: 0, validationTasks: 0, activeProjects: 0 };
        }
    };

    // Render error state
    if (error && retryCount > 2) {
        return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    // Render loading state
    if (loading && !selectedCategory) {
        return <LoadingSpinner tip="Loading HiTech module..." />;
    }

    const stats = getStats();

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="HiTech Module Error"
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
                            <RocketOutlined /> HiTech Department
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
                    description="HiTech data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Category Cards */}
            <Card
                title="HiTech Categories"
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color="blue">
                        {hitechCategories.length} Categories Available
                    </Tag>
                }
            >
                <Row gutter={[16, 16]}>
                    {hitechCategories.map((category) => (
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
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                loading={loading}
                                size="large"
                            >
                                Add New Record
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
                    <HiTechStatistics stats={stats} loading={loading} />

                    {/* Progress Bar for Completion Rate */}
                    <Card style={{ marginBottom: 24 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Text strong>Overall Progress</Text>
                            <Progress
                                percent={Math.round((stats.totalRecords / (stats.totalRecords + 10)) * 100)}
                                status="active"
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                            />
                            <Text type="secondary">
                                {stats.totalRecords} total records across all categories
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
                                    <Button type="primary" onClick={handleCreate}>
                                        <PlusOutlined /> Create First Record
                                    </Button>
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
                                Use the Export dropdown button above to download {tableData.length} records in Excel or PDF format.
                            </Text>
                            <Alert
                                message="Excel View Mode"
                                description="In Excel View mode, you can export the data to XLSX or PDF format for offline analysis. Switch to Web View for editing, deleting, and discussion features."
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
                        {editingRecord ? 'Edit' : 'Create'} {selectedCategory?.name} Record
                    </Space>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
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
                        Check HiTech Team Availability
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

                    {/* HiTech Users List */}
                    <Card size="small" title="HiTech Team Members">
                        {hitechUsers.length === 0 ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="No HiTech team members found"
                            />
                        ) : (
                            <List
                                dataSource={hitechUsers}
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
                                                    text="HiTech Team Member"
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
                <Card title="How to Use HiTech Module" style={{ borderRadius: '12px' }}>
                    <Alert
                        message="Manage HiTech Department Data"
                        description={
                            <div>
                                <Text strong>Follow these steps:</Text>
                                <ol>
                                    <li>Click on any category card above to select a data type</li>
                                    <li>Choose between Web View (for editing/discussion) or Excel View (for export)</li>
                                    <li>Date range is automatically set to yesterday to 9 days from today</li>
                                    <li>Use priority filter to view high-priority items first</li>
                                    <li>In Web View: Use Edit/Delete actions and Discuss features</li>
                                    <li>In Excel View: Export data to XLSX or PDF for offline analysis</li>
                                    <li>Red badge on Discuss button shows unread messages</li>
                                    <li>Use "Check Team Availability" to view team schedules</li>
                                    <li>Enable auto-refresh for automatic data updates every 2 minutes</li>
                                </ol>
                                <Text type="secondary">
                                    Each category represents different HiTech activities recorded in the system.
                                    Web View provides full interactive features while Excel View is for read-only data export.
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

export default HiTech;
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
    ImportOutlined, ContainerOutlined, TruckOutlined, FileTextOutlined,
    RocketOutlined, UsergroupAddOutlined, ShopOutlined,
    BookOutlined, BankOutlined, ProjectOutlined, CarOutlined,
    SolutionOutlined, ContactsOutlined, GiftOutlined
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
        title="Something went wrong in Surge-SurgeCare-Image Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading Surge-SurgeCare-Image data..." }) => (
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
const SurgeImagingStatistics = ({ stats, loading = false }) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Total Records"
                    value={stats?.totalRecords || 0}
                    prefix={<FileTextOutlined />}
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
            'college_session': 'surgi_imaging_college_session_fb',
            'meetings': 'surgi_imaging_meetings_fb',
            'principal_visit': 'surgi_imaging_principal_visit_fb',
            'promotional_activities': 'surgi_imaging_promotional_activities_fb',
            'special_tasks': 'surgi_imaging_special_tasks_fb',
            'visit_plan': 'surgi_imaging_visit_plan_fb'
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
                'surgi_imaging',
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
                    Discussion: {category.name}
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
                // Common structure for Surge Imaging modules
                const base = {
                    'Priority': getPriorityLabel(activity.priority),
                    'Created Date': activity.created_at
                        ? dayjs(activity.created_at).format('YYYY-MM-DD')
                        : ''
                };

                // Extend base based on table type
                switch (selectedCategory?.id) {
                    case 'college_session':
                        return {
                            ...base,
                            'Company': activity.company || '',
                            'College': activity.college || '',
                            'Session': activity.session || '',
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Responsible BDM': Array.isArray(activity.responsible_bdm_name) 
                                ? activity.responsible_bdm_name.join(', ')
                                : activity.responsible_bdm_name || '',
                            'Remarks': activity.remarks || ''
                        };

                    case 'meetings':
                        return {
                            ...base,
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Subject': activity.subject || '',
                            'Status': activity.status || ''
                        };

                    case 'principal_visit':
                        return {
                            ...base,
                            'Company': activity.company || '',
                            'Principal Name': activity.principle_name || '',
                            'Visitors Name': activity.visitors_name || '',
                            'Visitors Job': activity.visitors_job || '',
                            'Start Time': activity.start_time
                                ? dayjs(activity.start_time).format('YYYY-MM-DD HH:mm')
                                : '',
                            'End Time': activity.end_time
                                ? dayjs(activity.end_time).format('YYYY-MM-DD HH:mm')
                                : '',
                            'Purpose': activity.purpose || '',
                            'Responsible BDM': Array.isArray(activity.responsible_bdm) 
                                ? activity.responsible_bdm.join(', ')
                                : activity.responsible_bdm || ''
                        };

                    case 'promotional_activities':
                        return {
                            ...base,
                            'Company': activity.company || '',
                            'Promotional Activity': activity.promotional_activity || '',
                            'Type': activity.type || '',
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Responsible BDM': Array.isArray(activity.responsible_bdm_names) 
                                ? activity.responsible_bdm_names.join(', ')
                                : activity.responsible_bdm_names || '',
                            'Remarks': activity.remarks || ''
                        };

                    case 'special_tasks':
                        return {
                            ...base,
                            'Date': activity.date
                                ? dayjs(activity.date).format('YYYY-MM-DD')
                                : '',
                            'Task': activity.task || '',
                            'Status': activity.status || ''
                        };

                    case 'visit_plan':
                        return {
                            ...base,
                            'Schedule Date': activity.schedule_date
                                ? dayjs(activity.schedule_date).format('YYYY-MM-DD')
                                : '',
                            'Name': activity.name || '',
                            'Area': activity.area || '',
                            'Status': activity.status || ''
                        };

                    default:
                        return base;
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Surge Imaging Export');

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

            const fileName = `${selectedCategory?.name || 'surge_imaging_export'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

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
            doc.text('Surge Imaging Export Summary', 14, 15);
            doc.setFontSize(10);
            const categoryText = selectedCategory ? `Category: ${selectedCategory.name}` : '';
            doc.text(`${categoryText} | ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 22);

            let headers = [];
            let tableData = [];

            switch (selectedCategory?.id) {
                case 'college_session':
                    headers = ['Company', 'College', 'Session', 'Date', 'Responsible BDM', 'Priority'];
                    tableData = activities.map(a => [
                        a.company?.substring(0, 25) || '',
                        a.college?.substring(0, 25) || '',
                        a.session?.substring(0, 25) || '',
                        a.date ? dayjs(a.date).format('YYYY-MM-DD') : '',
                        Array.isArray(a.responsible_bdm_name) ? a.responsible_bdm_name.join(', ').substring(0, 25) : (a.responsible_bdm_name || '').substring(0, 25),
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                case 'meetings':
                    headers = ['Subject', 'Date', 'Status', 'Priority'];
                    tableData = activities.map(a => [
                        a.subject?.substring(0, 40) || '',
                        a.date ? dayjs(a.date).format('YYYY-MM-DD') : '',
                        a.status?.substring(0, 20) || '',
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                case 'principal_visit':
                    headers = ['Company', 'Principal', 'Visitors', 'Start Time', 'Priority'];
                    tableData = activities.map(a => [
                        a.company?.substring(0, 25) || '',
                        a.principle_name?.substring(0, 25) || '',
                        a.visitors_name?.substring(0, 25) || '',
                        a.start_time ? dayjs(a.start_time).format('YYYY-MM-DD HH:mm') : '',
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                case 'promotional_activities':
                    headers = ['Company', 'Activity', 'Type', 'Date', 'Priority'];
                    tableData = activities.map(a => [
                        a.company?.substring(0, 25) || '',
                        a.promotional_activity?.substring(0, 30) || '',
                        a.type?.substring(0, 20) || '',
                        a.date ? dayjs(a.date).format('YYYY-MM-DD') : '',
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                case 'special_tasks':
                    headers = ['Task', 'Date', 'Status', 'Priority'];
                    tableData = activities.map(a => [
                        a.task?.substring(0, 40) || '',
                        a.date ? dayjs(a.date).format('YYYY-MM-DD') : '',
                        a.status?.substring(0, 20) || '',
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                case 'visit_plan':
                    headers = ['Name', 'Schedule Date', 'Area', 'Status', 'Priority'];
                    tableData = activities.map(a => [
                        a.name?.substring(0, 30) || '',
                        a.schedule_date ? dayjs(a.schedule_date).format('YYYY-MM-DD') : '',
                        a.area?.substring(0, 20) || '',
                        a.status?.substring(0, 20) || '',
                        getPriorityLabel(a.priority)
                    ]);
                    break;

                default:
                    headers = ['Record', 'Date', 'Priority'];
                    tableData = activities.map(a => [
                        'Record',
                        a.date ? dayjs(a.date).format('YYYY-MM-DD') : '',
                        getPriorityLabel(a.priority)
                    ]);
            }

            let y = 35;
            const xStart = 14;
            const colWidths = headers.map(() => 30); // Equal width for all columns
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
                    doc.text(cell.toString(), x + 2, y);
                    x += colWidths[i];
                });
                y += lineHeight;
            });

            const fileName = `${selectedCategory?.name || 'surge_imaging_export'}_${dayjs().format('YYYY-MM-DD')}.pdf`;

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

const SurgeSurgeCareImageView = () => {
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

    // Categories state
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // View mode state (web view or excel view)
    const [viewMode, setViewMode] = useState('web'); // 'web' or 'excel'

    // Discussion States
    const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    // Priority filter state
    const [priorityFilter, setPriorityFilter] = useState(null);

    // Surge Imaging Categories configuration based on your schema
    const surgeImagingCategories = [
        {
            id: 'college_session',
            name: 'SSI - College Session',
            table: 'surgi_imaging_college_session',
            type: 'College Session',
            icon: <BookOutlined />,
            dateField: 'date',
            color: '#1890ff',
            hasTimeFields: false,
            categoryId: 'c7d1f129-af2e-42a4-9199-896d352d8bf1'
        },
        {
            id: 'meetings',
            name: 'SSI - Meetings',
            table: 'surgi_imaging_meetings',
            type: 'Meetings',
            icon: <TeamOutlined />,
            dateField: 'date',
            color: '#52c41a',
            hasTimeFields: false,
            categoryId: '0db2bf41-3cf6-4eb5-b895-70fded4e1b33'
        },
        {
            id: 'principal_visit',
            name: 'SSI - Principle Visit',
            table: 'surgi_imaging_principal_visit',
            type: 'Principal Visit',
            icon: <BankOutlined />,
            dateField: 'start_time',
            color: '#fa8c16',
            hasTimeFields: true,
            categoryId: '909503ad-5b51-4c8a-92f3-aee94d102d77'
        },
        {
            id: 'promotional_activities',
            name: 'SSI - Promotional Activities',
            table: 'surgi_imaging_promotional_activities',
            type: 'Promotional',
            icon: <GiftOutlined />,
            dateField: 'date',
            color: '#722ed1',
            hasTimeFields: false,
            categoryId: 'f9e44b27-e74b-4184-a25f-11b2db23f0ee'
        },
        {
            id: 'special_tasks',
            name: 'SSI - Special Tasks',
            table: 'surgi_imaging_special_tasks',
            type: 'Special Tasks',
            icon: <ProjectOutlined />,
            dateField: 'date',
            color: '#fa541c',
            hasTimeFields: false,
            categoryId: 'bca26c61-f36e-41bb-87a4-c2794c260a12'
        },
        {
            id: 'visit_plan',
            name: 'SSI - Visit Plan',
            table: 'surgi_imaging_visit_plan',
            type: 'Visit Plan',
            icon: <CarOutlined />,
            dateField: 'schedule_date',
            color: '#13c2c2',
            hasTimeFields: false,
            categoryId: 'bdaf25d9-5479-40a2-aad3-add577d2b4f7'
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

    // Surge Imaging department ID
    const SURGE_IMAGING_DEPARTMENT_ID = '3b55797c-3170-46ce-9119-6cd6ec74b6ec';

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
        initializeSurgeImaging();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshSurgeImagingData();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshSurgeImagingData = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.info('Surge Imaging data updated automatically');
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
            toast.success('Surge Imaging data refreshed successfully');
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

    // Fetch categories
    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            handleError(error, 'fetching categories');
        } finally {
            setCategoriesLoading(false);
        }
    };

    // Initialize Surge Imaging module
    const initializeSurgeImaging = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchProfiles(),
                fetchCategories()
            ]);

            // Set default date range after initialization
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'initializing Surge Imaging module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeSurgeImaging();
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
                .eq('department_id', SURGE_IMAGING_DEPARTMENT_ID) // Always filter by Surge Imaging department
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
                'college_session': 'surgi_imaging_college_session_fb',
                'meetings': 'surgi_imaging_meetings_fb',
                'principal_visit': 'surgi_imaging_principal_visit_fb',
                'promotional_activities': 'surgi_imaging_promotional_activities_fb',
                'special_tasks': 'surgi_imaging_special_tasks_fb',
                'visit_plan': 'surgi_imaging_visit_plan_fb'
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
                if (record.schedule_date) {
                    formattedRecord.schedule_date = safeDayjs(record.schedule_date);
                }
                if (record.start_time) {
                    formattedRecord.start_time = safeDayjs(record.start_time);
                }
                if (record.end_time) {
                    formattedRecord.end_time = safeDayjs(record.end_time);
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
                'surgi_imaging',
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

            // Prepare data for submission - include department_id and category_id
            const submitData = { 
                ...values,
                department_id: SURGE_IMAGING_DEPARTMENT_ID,
                category_id: selectedCategory.categoryId // Use the predefined category ID
            };

            // Convert dayjs objects to proper formats with error handling
            Object.keys(submitData).forEach(key => {
                try {
                    const value = submitData[key];
                    if (dayjs.isDayjs(value)) {
                        if (key === 'start_time' || key === 'end_time') {
                            // Convert datetime to ISO string
                            submitData[key] = value.toISOString();
                        } else {
                            // Convert date to YYYY-MM-DD format
                            submitData[key] = value.format('YYYY-MM-DD');
                        }
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
                    'surgi_imaging',
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
                    'surgi_imaging',
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
                case 'college_session':
                    return [
                        ...baseColumns,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'College', dataIndex: 'college', key: 'college', width: 150 },
                        { title: 'Session', dataIndex: 'session', key: 'session', width: 150 },
                        { 
                            title: 'Responsible BDM', 
                            dataIndex: 'responsible_bdm_name', 
                            key: 'responsible_bdm_name', 
                            width: 150,
                            render: (bdms) => {
                                if (Array.isArray(bdms)) {
                                    return bdms.join(', ');
                                }
                                return bdms || '-';
                            }
                        },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 150 },
                        actionColumn
                    ];

                case 'meetings':
                    return [
                        ...baseColumns,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Subject', dataIndex: 'subject', key: 'subject', width: 200 },
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
                        actionColumn
                    ];

                case 'principal_visit':
                    return [
                        ...baseColumns,
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'Principal Name', dataIndex: 'principle_name', key: 'principle_name', width: 150 },
                        { title: 'Visitors Name', dataIndex: 'visitors_name', key: 'visitors_name', width: 150 },
                        { title: 'Visitors Job', dataIndex: 'visitors_job', key: 'visitors_job', width: 120 },
                        { 
                            title: 'Start Time', 
                            dataIndex: 'start_time', 
                            key: 'start_time', 
                            width: 150,
                            render: (time) => time ? safeDayjs(time).format('DD/MM/YYYY HH:mm') : '-'
                        },
                        { 
                            title: 'End Time', 
                            dataIndex: 'end_time', 
                            key: 'end_time', 
                            width: 150,
                            render: (time) => time ? safeDayjs(time).format('DD/MM/YYYY HH:mm') : '-'
                        },
                        { title: 'Purpose', dataIndex: 'purpose', key: 'purpose', width: 150 },
                        { 
                            title: 'Responsible BDM', 
                            dataIndex: 'responsible_bdm', 
                            key: 'responsible_bdm', 
                            width: 150,
                            render: (bdms) => {
                                if (Array.isArray(bdms)) {
                                    return bdms.join(', ');
                                }
                                return bdms || '-';
                            }
                        },
                        actionColumn
                    ];

                case 'promotional_activities':
                    return [
                        ...baseColumns,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Company', dataIndex: 'company', key: 'company', width: 150 },
                        { title: 'Promotional Activity', dataIndex: 'promotional_activity', key: 'promotional_activity', width: 200 },
                        { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
                        { 
                            title: 'Responsible BDM', 
                            dataIndex: 'responsible_bdm_names', 
                            key: 'responsible_bdm_names', 
                            width: 150,
                            render: (bdms) => {
                                if (Array.isArray(bdms)) {
                                    return bdms.join(', ');
                                }
                                return bdms || '-';
                            }
                        },
                        { title: 'Remarks', dataIndex: 'remarks', key: 'remarks', width: 150 },
                        actionColumn
                    ];

                case 'special_tasks':
                    return [
                        ...baseColumns,
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Task', dataIndex: 'task', key: 'task', width: 200 },
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
                        actionColumn
                    ];

                case 'visit_plan':
                    return [
                        ...baseColumns,
                        { title: 'Schedule Date', dataIndex: 'schedule_date', key: 'schedule_date', width: 120 },
                        { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
                        { title: 'Area', dataIndex: 'area', key: 'area', width: 120 },
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
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
                case 'college_session':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Session Date"
                                rules={[{ required: true, message: 'Please select session date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select session date"
                                />
                            </Form.Item>
                            <Form.Item
                                name="company"
                                label="Company"
                                rules={[{ required: true, message: 'Please enter company name' }]}
                            >
                                <Input placeholder="Enter company name" />
                            </Form.Item>
                            <Form.Item
                                name="college"
                                label="College"
                                rules={[{ required: true, message: 'Please enter college name' }]}
                            >
                                <Input placeholder="Enter college name" />
                            </Form.Item>
                            <Form.Item
                                name="session"
                                label="Session"
                            >
                                <Input placeholder="Enter session details" />
                            </Form.Item>
                            <Form.Item
                                name="responsible_bdm_name"
                                label="Responsible BDM"
                            >
                                <Select
                                    mode="tags"
                                    style={{ width: '100%' }}
                                    placeholder="Enter BDM names"
                                    tokenSeparators={[',']}
                                />
                            </Form.Item>
                            <Form.Item
                                name="remarks"
                                label="Remarks"
                            >
                                <TextArea rows={3} placeholder="Enter any remarks" />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'meetings':
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
                            <Form.Item
                                name="subject"
                                label="Subject"
                                rules={[{ required: true, message: 'Please enter meeting subject' }]}
                            >
                                <TextArea rows={3} placeholder="Enter meeting subject" />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                            >
                                <Select placeholder="Select status">
                                    <Option value="Scheduled">Scheduled</Option>
                                    <Option value="Completed">Completed</Option>
                                    <Option value="Cancelled">Cancelled</Option>
                                    <Option value="Postponed">Postponed</Option>
                                </Select>
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'principal_visit':
                    return (
                        <>
                            <Form.Item
                                name="company"
                                label="Company"
                                rules={[{ required: true, message: 'Please enter company name' }]}
                            >
                                <Input placeholder="Enter company name" />
                            </Form.Item>
                            <Form.Item
                                name="principle_name"
                                label="Principal Name"
                                rules={[{ required: true, message: 'Please enter principal name' }]}
                            >
                                <Input placeholder="Enter principal name" />
                            </Form.Item>
                            <Form.Item
                                name="visitors_name"
                                label="Visitors Name"
                            >
                                <Input placeholder="Enter visitors name" />
                            </Form.Item>
                            <Form.Item
                                name="visitors_job"
                                label="Visitors Job"
                            >
                                <Input placeholder="Enter visitors job title" />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="start_time"
                                        label="Start Time"
                                    >
                                        <DatePicker
                                            showTime
                                            style={{ width: '100%' }}
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Select start time"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="end_time"
                                        label="End Time"
                                    >
                                        <DatePicker
                                            showTime
                                            style={{ width: '100%' }}
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Select end time"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                name="purpose"
                                label="Purpose"
                            >
                                <TextArea rows={3} placeholder="Enter visit purpose" />
                            </Form.Item>
                            <Form.Item
                                name="responsible_bdm"
                                label="Responsible BDM"
                            >
                                <Select
                                    mode="tags"
                                    style={{ width: '100%' }}
                                    placeholder="Enter BDM names"
                                    tokenSeparators={[',']}
                                />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'promotional_activities':
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
                            <Form.Item
                                name="company"
                                label="Company"
                                rules={[{ required: true, message: 'Please enter company name' }]}
                            >
                                <Input placeholder="Enter company name" />
                            </Form.Item>
                            <Form.Item
                                name="promotional_activity"
                                label="Promotional Activity"
                                rules={[{ required: true, message: 'Please enter promotional activity' }]}
                            >
                                <TextArea rows={3} placeholder="Enter promotional activity details" />
                            </Form.Item>
                            <Form.Item
                                name="type"
                                label="Type"
                            >
                                <Input placeholder="Enter activity type" />
                            </Form.Item>
                            <Form.Item
                                name="responsible_bdm_names"
                                label="Responsible BDM"
                            >
                                <Select
                                    mode="tags"
                                    style={{ width: '100%' }}
                                    placeholder="Enter BDM names"
                                    tokenSeparators={[',']}
                                />
                            </Form.Item>
                            <Form.Item
                                name="remarks"
                                label="Remarks"
                            >
                                <TextArea rows={3} placeholder="Enter any remarks" />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'special_tasks':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Task Date"
                                rules={[{ required: true, message: 'Please select task date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select task date"
                                />
                            </Form.Item>
                            <Form.Item
                                name="task"
                                label="Task"
                                rules={[{ required: true, message: 'Please enter task details' }]}
                            >
                                <TextArea rows={3} placeholder="Enter task details" />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                            >
                                <Select placeholder="Select status">
                                    <Option value="Pending">Pending</Option>
                                    <Option value="In Progress">In Progress</Option>
                                    <Option value="Completed">Completed</Option>
                                    <Option value="Cancelled">Cancelled</Option>
                                </Select>
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'visit_plan':
                    return (
                        <>
                            <Form.Item
                                name="schedule_date"
                                label="Schedule Date"
                                rules={[{ required: true, message: 'Please select schedule date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select schedule date"
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
                                name="area"
                                label="Area"
                            >
                                <Input placeholder="Enter area" />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                            >
                                <Select placeholder="Select status">
                                    <Option value="Scheduled">Scheduled</Option>
                                    <Option value="Visited">Visited</Option>
                                    <Option value="Cancelled">Cancelled</Option>
                                    <Option value="Postponed">Postponed</Option>
                                </Select>
                            </Form.Item>
                            {commonFields}
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
        return <LoadingSpinner tip="Loading Surge Imaging module..." />;
    }

    const stats = getStats();

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="Surge Imaging Module Error"
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
                            <SolutionOutlined /> Surge-SurgeCare-Image Department
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
                </Row>
            </Card>

            {autoRefresh && (
                <Alert
                    message="Auto-refresh Enabled"
                    description="Surge Imaging data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Category Cards */}
            <Card
                title="Surge Imaging Categories"
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color="blue">
                        {surgeImagingCategories.length} Categories Available
                    </Tag>
                }
            >
                <Row gutter={[16, 16]}>
                    {surgeImagingCategories.map((category) => (
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
                    <SurgeImagingStatistics stats={stats} loading={loading} />

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
                <Card title="How to Use Surge Imaging Module" style={{ borderRadius: '12px' }}>
                    <Alert
                        message="Manage Surge-SurgeCare-Image Department Data"
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
                                    <li>Enable auto-refresh for automatic data updates every 2 minutes</li>
                                </ol>
                                <Text type="secondary">
                                    Each category represents different Surge Imaging activities recorded in the system.
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

export default SurgeSurgeCareImageView;
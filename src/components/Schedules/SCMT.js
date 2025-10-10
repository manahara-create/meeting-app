import React, { useState, useEffect } from 'react';
import {
  Card, Button, Row, Col, Typography, Table, DatePicker,
  Space, Tag, Statistic, Alert, Spin, Modal, Form, Input,
  Select, InputNumber, message, Popconfirm, Divider, List,
  Tooltip, Badge, Timeline, Empty, Result, Checkbox
} from 'antd';
import {
  TeamOutlined, CalendarOutlined, CheckCircleOutlined,
  UserOutlined, FilterOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined,
  EnvironmentOutlined, CarryOutOutlined, ScheduleOutlined,
  CloseOutlined, WarningOutlined, ReloadOutlined, ExclamationCircleOutlined,
  ShoppingOutlined, ContainerOutlined, ToolOutlined,
  MessageOutlined, WechatOutlined, SendOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend dayjs with plugins
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Result
    status="error"
    title="Something went wrong in SCMT Module"
    subTitle={error?.message || "An unexpected error occurred"}
    extra={
      <Button type="primary" onClick={resetErrorBoundary}>
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
const DiscussionModal = ({ 
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

  // Add safety check for category
  const feedbackTable = category ? `${category.table}_fb` : null;

  const fetchMessages = async () => {
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
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!record?.id || !feedbackTable) return;

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
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !record?.id || !feedbackTable) {
      message.warning('Cannot send message: Missing required data');
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
          department_id: record.department_id,
          category_id: record.category_id
        }]);

      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markMessagesAsRead = async () => {
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
  };

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
  }, [visible, record, category]);

  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);

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
          Discussion: {record?.type || record?.supplier || 'Record'} 
          {record?.date && ` - ${dayjs(record.date).format('DD/MM/YYYY')}`}
          {record?.start_date && ` - ${dayjs(record.start_date).format('DD/MM/YYYY')}`}
          {record?.date_of_arrival && ` - ${dayjs(record.date_of_arrival).format('DD/MM/YYYY')}`}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      style={{ top: 20 }}
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
};

const SCMT = () => {
  // Error handling states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

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

  // SCMT Categories configuration - Updated with Weekly Shipments
  const scmtCategories = [
    {
      id: 'delivery_distribution',
      name: 'Delivery and Distribution',
      table: 'scmt_d_n_d',
      type: 'Task',
      icon: <CarryOutOutlined />,
      dateField: 'start_date'
    },
    {
      id: 'meetings_sessions',
      name: 'Meetings and Sessions',
      table: 'scmt_meetings_and_sessions',
      type: 'Meeting',
      icon: <CalendarOutlined />,
      dateField: 'date'
    },
    {
      id: 'other_operations',
      name: 'Other Operations Activities',
      table: 'scmt_others',
      type: 'Task',
      icon: <CheckCircleOutlined />,
      dateField: 'date'
    },
    {
      id: 'weekly_meetings_scmt',
      name: 'Weekly Shipments',
      table: 'scmt_weekly_meetings',
      type: 'Task',
      icon: <CalendarOutlined />,
      dateField: 'date_of_arrival',
      description: ''
    }
  ];

  // Error handler
  const handleError = (error, context = 'Unknown operation') => {
    console.error(`Error in ${context}:`, error);
    
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    message.error({
      content: `Error in ${context}: ${errorMessage}`,
      duration: 5,
      key: `scmt-error-${context}`
    });
    
    setError({
      message: errorMessage,
      context,
      timestamp: new Date().toISOString()
    });
    
    return error;
  };

  // Safe state update wrapper
  const safeSetState = (setter, value) => {
    try {
      setter(value);
    } catch (err) {
      handleError(err, 'state update');
    }
  };

  // Safe date parsing function with enhanced error handling
  const safeDayjs = (date, format = null) => {
    try {
      if (!date) {
        console.warn('No date provided to safeDayjs');
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
  };

  // Safe isBetween function with error handling
  const safeIsBetween = (date, start, end, unit = 'day', inclusivity = '[]') => {
    try {
      const targetDate = safeDayjs(date);
      const startDate = safeDayjs(start);
      const endDate = safeDayjs(end);
      
      if (!targetDate.isValid() || !startDate.isValid() || !endDate.isValid()) {
        console.warn('Invalid dates in safeIsBetween:', { date, start, end });
        return false;
      }
      
      if (typeof targetDate.isBetween !== 'function') {
        console.warn('isBetween function not available, using fallback logic');
        return (targetDate.isSameOrAfter(startDate, unit) && 
                targetDate.isSameOrBefore(endDate, unit));
      }
      
      return targetDate.isBetween(startDate, endDate, unit, inclusivity);
    } catch (error) {
      console.error('Error in safeIsBetween:', error);
      return false;
    }
  };

  // Reset error boundary
  const resetErrorBoundary = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    initializeSCMT();
  };

  // Fetch unread message counts for records
  const fetchUnreadCounts = async (records, category) => {
    if (!currentUser || !records.length || !category) return;

    try {
      const feedbackTable = `${category.table}_fb`;
      const counts = {};

      // Fetch unread counts for each record
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

  // Initialize SCMT module
  const initializeSCMT = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchCurrentUser(),
        fetchProfiles(),
        fetchSCMTUsers()
      ]);
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
    if (selectedCategory && dateRange[0] && dateRange[1]) {
      fetchTableData();
    }
  }, [selectedCategory, dateRange]);

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
        // Try alternative department names
        const { data: altDeptData, error: altDeptError } = await supabase
          .from('departments')
          .select('id')
          .or('name.ilike.%scmt%,name.ilike.%customer care%,name.ilike.%supply chain%')
          .single();

        if (altDeptError) {
          // Fallback to all users if department not found
          console.warn('SCMT department not found, using all users as fallback');
          const { data: allUsers, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, department_id')
            .order('full_name');

          if (usersError) throw usersError;
          safeSetState(setScmtUsers, allUsers || []);
          return;
        }
        
        if (altDeptData) {
          const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, department_id')
            .eq('department_id', altDeptData.id)
            .order('full_name');

          if (usersError) throw usersError;
          safeSetState(setScmtUsers, usersData || []);
        }
        return;
      }

      if (deptData) {
        // Get all users in SCMT department
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, department_id')
          .eq('department_id', deptData.id)
          .order('full_name');

        if (usersError) throw usersError;
        safeSetState(setScmtUsers, usersData || []);
      }
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

  const fetchUserSchedule = async (userId, startDate, endDate) => {
    if (!userId || !startDate || !endDate) {
      message.warning('Please provide user ID and date range');
      return;
    }

    setAvailabilityLoading(true);
    try {
      const formattedStart = safeDayjs(startDate).format('YYYY-MM-DD');
      const formattedEnd = safeDayjs(endDate).format('YYYY-MM-DD');

      if (!formattedStart || !formattedEnd) {
        throw new Error('Invalid date range for schedule fetch');
      }

      // Fetch personal meetings for the user
      const { data: personalMeetings, error: personalError } = await supabase
        .from('personal_meetings')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', formattedStart)
        .lte('end_date', formattedEnd)
        .order('start_date', { ascending: true });

      if (personalError) throw personalError;

      // Fetch SCMT activities for the user with Promise.allSettled for resilience
      let scmtActivities = [];
      const scmtPromises = scmtCategories.map(async (category) => {
        try {
          let query = supabase
            .from(category.table)
            .select('*')
            .gte(category.dateField, formattedStart)
            .lte(category.dateField, formattedEnd);

          // Try different user matching strategies
          query = query.or(`responsible.eq.${userId},responsible_2.ilike.%${selectedUser?.full_name}%,responsible_2.ilike.%${selectedUser?.email}%`);

          const { data: activities, error: activityError } = await query;

          if (!activityError && activities) {
            return activities.map(activity => ({
              ...activity,
              type: 'scmt_activity',
              activity_type: category.name,
              source_table: category.table
            }));
          }
          return [];
        } catch (tableError) {
          console.warn(`Error fetching from ${category.table}:`, tableError);
          return [];
        }
      });

      const scmtResults = await Promise.allSettled(scmtPromises);
      scmtActivities = scmtResults
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);

      const allSchedule = [
        ...(personalMeetings || []).map(meeting => ({
          ...meeting,
          type: 'personal_meeting'
        })),
        ...scmtActivities
      ].sort((a, b) => {
        try {
          const getDate = (item) => {
            return item.start_date || item[selectedCategory?.dateField] || item.date || item.created_at;
          };
          
          const dateA = safeDayjs(getDate(a));
          const dateB = safeDayjs(getDate(b));
          
          if (!dateA.isValid() || !dateB.isValid()) {
            return 0;
          }
          
          return dateA - dateB;
        } catch (sortError) {
          console.warn('Error sorting schedule items:', sortError);
          return 0;
        }
      });

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
      form.resetFields();
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

      // Format dates for the form
      const formattedRecord = { ...record };

      try {
        // Format date fields based on category
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
        // Continue without date formatting
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

      message.success('Record deleted successfully');
      fetchTableData();
    } catch (error) {
      handleError(error, 'deleting record');
    }
  };

  const checkUserAvailability = async (userId, startDate, endDate) => {
    try {
      if (!userId || !startDate || !endDate) {
        return { available: true, conflicts: [] };
      }

      const formattedStart = safeDayjs(startDate).format('YYYY-MM-DD');
      const formattedEnd = safeDayjs(endDate).format('YYYY-MM-DD');

      const { data: conflicts, error } = await supabase
        .from('personal_meetings')
        .select('*')
        .eq('user_id', userId)
        .or(`and(start_date.lte.${formattedEnd},end_date.gte.${formattedStart})`);

      if (error) throw error;

      return {
        available: (conflicts?.length || 0) === 0,
        conflicts: conflicts || []
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: true, conflicts: [] };
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
          // Keep original value if conversion fails
        }
      });

      // Check availability for responsible persons if dates are involved
      if (submitData.responsible_2 && (submitData.start_date || submitData.date)) {
        const eventDate = submitData.start_date || submitData.date;
        const responsibleNames = Array.isArray(submitData.responsible_2) 
          ? submitData.responsible_2 
          : [submitData.responsible_2];

        for (const personName of responsibleNames) {
          const scmtUser = scmtUsers.find(user => 
            user.full_name === personName || user.email === personName
          );
          
          if (scmtUser) {
            const availability = await checkUserAvailability(scmtUser.id, eventDate, eventDate);
            if (!availability.available) {
              message.warning(`${personName} has scheduling conflicts on ${eventDate}. Please check availability.`);
            }
          }
        }
      }

      if (editingRecord) {
        // Update existing record
        const { error } = await supabase
          .from(selectedCategory.table)
          .update(submitData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        message.success('Record updated successfully');
      } else {
        // Create new record
        const { error } = await supabase
          .from(selectedCategory.table)
          .insert([submitData]);

        if (error) throw error;
        message.success('Record created successfully');
      }

      safeSetState(setModalVisible, false);
      fetchTableData();
    } catch (error) {
      handleError(error, 'saving record');
    }
  };

  const handleUserAvailabilityClick = () => {
    try {
      safeSetState(setAvailabilityModalVisible, true);
      safeSetState(setSelectedUser, null);
      safeSetState(setUserSchedule, []);
      safeSetState(setAvailabilityDateRange, [null, null]);
    } catch (error) {
      handleError(error, 'opening availability modal');
    }
  };

  const handleUserSelect = (user) => {
    try {
      safeSetState(setSelectedUser, user);
      safeSetState(setUserSchedule, []);
      if (availabilityDateRange[0] && availabilityDateRange[1]) {
        fetchUserSchedule(user.id, availabilityDateRange[0], availabilityDateRange[1]);
      }
    } catch (error) {
      handleError(error, 'selecting user');
    }
  };

  const handleAvailabilityDateChange = (dates) => {
    try {
      safeSetState(setAvailabilityDateRange, dates || [null, null]);
      if (selectedUser && dates && dates[0] && dates[1]) {
        fetchUserSchedule(selectedUser.id, dates[0], dates[1]);
      }
    } catch (error) {
      handleError(error, 'changing availability date range');
    }
  };

  const handleDiscussionClick = (record) => {
    try {
      if (!selectedCategory) {
        message.warning('Please select a category first');
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
        }
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
        return { totalRecords: 0, upcomingRecords: 0, completedRecords: 0 };
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

      return { totalRecords, upcomingRecords, completedRecords };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { totalRecords: 0, upcomingRecords: 0, completedRecords: 0 };
    }
  };

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
    <div>
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

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>
          <TeamOutlined /> SCMT - Customer Care Department
        </Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={resetErrorBoundary}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<UserOutlined />}
            onClick={handleUserAvailabilityClick}
          >
            Check Users Availability
          </Button>
        </Space>
      </div>

      {/* Category Buttons */}
      <Card title="SCMT Categories" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} justify="center">
          {scmtCategories.map((category) => (
            <Col xs={24} sm={12} md={8} key={category.id}>
              <Button
                type={selectedCategory?.id === category.id ? 'primary' : 'default'}
                size="large"
                block
                style={{
                  height: '120px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => handleCategoryClick(category)}
                disabled={loading}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                  {category.icon}
                </div>
                <div>{category.name}</div>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  {category.type}
                </Text>
                {category.description && (
                  <Text type="secondary" style={{ fontSize: '10px', marginTop: '2px' }}>
                    {category.description}
                  </Text>
                )}
              </Button>
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
              Filter Data by Date Range
            </Space>
          }
          style={{ marginBottom: 24 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              loading={loading}
            >
              Add New Record
            </Button>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text>Select date range to view {selectedCategory.name} data:</Text>
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: '300px' }}
              format="DD/MM/YYYY"
              disabled={loading}
            />
            {dateRange[0] && dateRange[1] && (
              <Text type="secondary">
                Showing data from {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} to {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
              </Text>
            )}
          </Space>
        </Card>
      )}

      {/* Statistics */}
      {selectedCategory && dateRange[0] && dateRange[1] && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Records"
                value={stats.totalRecords}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Upcoming"
                value={stats.upcomingRecords}
                valueStyle={{ color: '#cf1322' }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completedRecords}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Data Table */}
      {selectedCategory && dateRange[0] && dateRange[1] && (
        <Card
          title={`${selectedCategory.name} Data (${tableData.length} records)`}
          extra={
            <Tag color="blue">
              {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Tag>
          }
        >
          {loading ? (
            <LoadingSpinner tip={`Loading ${selectedCategory.name} data...`} />
          ) : tableData.length === 0 ? (
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical">
                  <Text>No records found for selected date range</Text>
                  <Text type="secondary">Try selecting a different date range or create new records</Text>
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
              <Button type="primary" htmlType="submit">
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
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Card>

          {/* SCMT Users List */}
          <Card size="small" title="SCMT Team Members">
            {scmtUsers.length === 0 ? (
              <Empty 
                description="No SCMT team members found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={scmtUsers}
                renderItem={user => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => handleUserSelect(user)}
                        disabled={!availabilityDateRange[0] || !availabilityDateRange[1]}
                        loading={availabilityLoading && selectedUser?.id === user.id}
                      >
                        View Schedule
                      </Button>
                    ]}
                  >
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* User Schedule */}
          {selectedUser && (
            <Card 
              size="small" 
              title={
                <Space>
                  <ScheduleOutlined />
                  Schedule for {selectedUser.full_name || selectedUser.email}
                  {availabilityDateRange[0] && availabilityDateRange[1] && (
                    <Tag color="blue">
                      {safeDayjs(availabilityDateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(availabilityDateRange[1]).format('DD/MM/YYYY')}
                    </Tag>
                  )}
                </Space>
              }
              extra={
                <Badge 
                  count={userSchedule.length} 
                  showZero 
                  color={userSchedule.length > 0 ? 'orange' : 'green'}
                />
              }
            >
              {availabilityLoading ? (
                <LoadingSpinner tip="Loading user schedule..." />
              ) : userSchedule.length > 0 ? (
                <Timeline>
                  {userSchedule.map((item, index) => (
                    <Timeline.Item
                      key={index}
                      color={getScheduleItemColor(item)}
                      dot={getScheduleItemIcon(item)}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Text strong>
                          {item.topic || item.type || item.activity_type || 'Unknown Activity'}
                        </Text>
                        <Text type="secondary">
                          {item.type === 'personal_meeting' ? 'Personal Meeting' : `SCMT ${item.activity_type}`}
                        </Text>
                        <Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {safeDayjs(item.start_date || item[selectedCategory?.dateField] || item.date).format('DD/MM/YYYY')}
                            {item.end_date && ` to ${safeDayjs(item.end_date).format('DD/MM/YYYY')}`}
                          </Text>
                          {item.location && (
                            <Tag size="small" color="blue">
                              {item.location}
                            </Tag>
                          )}
                        </Space>
                        {item.description && (
                          <Text style={{ fontSize: '12px' }}>
                            {item.description}
                          </Text>
                        )}
                        {item.day && (
                          <Tag size="small" color="purple">
                            {item.day}
                          </Tag>
                        )}
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical">
                      <Text>No scheduled activities found</Text>
                      <Text type="secondary">User is available during this period</Text>
                    </Space>
                  }
                />
              )}
            </Card>
          )}

          {/* Availability Tips */}
          <Alert
            message="Availability Check Tips"
            description={
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Select a date range to check user availability</li>
                <li>Click "View Schedule" to see user's detailed schedule</li>
                <li>Green timeline items indicate SCMT activities</li>
                <li>Blue timeline items indicate personal meetings</li>
                <li>Empty schedule means the user is available</li>
                <li>System will warn you about scheduling conflicts when creating records</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Space>
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
        <Card title="How to Use">
          <Alert
            message="Manage SCMT Department Data"
            description={
              <div>
                <Text strong>Follow these steps:</Text>
                <ol>
                  <li>Click on any category button above to select a data type</li>
                  <li>Select a date range using the date picker</li>
                  <li>View the filtered data in the table below</li>
                  <li>Use the "Add New Record" button to create new entries</li>
                  <li>Use Edit/Delete actions in the table to manage records</li>
                  <li>Use "Discuss" button to participate in group discussions for each record</li>
                  <li>Red badge on Discuss button shows unread messages</li>
                  <li>Use "Check Users Availability" to view team schedules and avoid conflicts</li>
                </ol>
                <Text type="secondary">
                  SCMT - Customer Care department manages delivery, distribution, meetings, and operational activities to ensure excellent customer service.
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
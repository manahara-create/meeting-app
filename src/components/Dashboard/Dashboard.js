import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Typography,
  Tag,
  Badge,
  Tabs,
  Select,
  Progress,
  Avatar,
  Input,
  Button,
  message,
  Modal,
  Space,
  Popover,
  Alert,
  Switch,
  Pagination,
  Spin,
  Empty,
  Result
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MessageOutlined,
  SearchOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FrownOutlined
} from '@ant-design/icons';
import Calendar from 'antd/es/calendar';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';

const { Title, Text, TextArea } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const priorityColors = {
  1: 'green',
  2: 'blue',
  3: 'orange',
  4: 'red',
  5: 'brown'
};

const priorityLabels = {
  1: 'Can be rescheduled',
  2: 'Slightly Urgent',
  3: 'Intermediate',
  4: 'High Priority',
  5: 'Urgent'
};

const statusColors = {
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'red',
  pending: 'orange',
  in_progress: 'orange'
};

// Table to category mapping with type classification
const tableCategoryMapping = {
  // BDM Department Tables
  'bdm_customer_visit': { type: 'task', categoryName: 'Customer Visit' },
  'bdm_principle_visit': { type: 'task', categoryName: 'Principle Visit' },
  'bdm_weekly_meetings': { type: 'meeting', categoryName: 'Weekly Meetings' },
  'bdm_college_session': { type: 'meeting', categoryName: 'College Session' },
  'bdm_promotional_activities': { type: 'task', categoryName: 'Promotional Activities' },
  
  // Sales Operations Department Tables
  'sales_operations_meetings': { type: 'meeting', categoryName: 'Meetings' },
  'sales_operations_tasks': { type: 'task', categoryName: 'Special Tasks' },
  
  // SCMT Department Tables
  'scmt_d_n_d': { type: 'task', categoryName: 'Delivery and Distributions' },
  'scmt_meetings_and_sessions': { type: 'meeting', categoryName: 'Meetings and Sessions' },
  'scmt_others': { type: 'task', categoryName: 'Other Operation Activities' }
};

// Error boundary component for fallback UI
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Result
    status="error"
    title="Something went wrong"
    subTitle={error?.message || "An unexpected error occurred"}
    extra={
      <Button type="primary" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    }
  />
);

// Loading component with better UX
const LoadingSpinner = ({ tip = "Loading dashboard data..." }) => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" tip={tip} />
  </div>
);

const Dashboard = () => {
  // State for error handling
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const [activeTab, setActiveTab] = useState('organizational');
  const [allMeetings, setAllMeetings] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [personalMeetings, setPersonalMeetings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalTasks: 0,
    thisWeekMeetings: 0,
    highPriorityMeetings: 0,
    completedMeetings: 0,
    pendingTasks: 0
  });
  const [organizationalStats, setOrganizationalStats] = useState({
    departmentMeetings: [],
    departmentTasks: [],
    monthlyTrend: [],
    completionRate: 0,
    busiestDepartment: ''
  });
  const [personalStats, setPersonalStats] = useState({
    myMeetings: 0,
    myTasks: 0,
    upcomingMeetings: 0,
    highPriorityCount: 0,
    personalMeetingsCount: 0
  });


  // Modal states
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [calendarView, setCalendarView] = useState('month');

  // Pagination states
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const pageSize = 5;

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Error boundary reset function
  const resetErrorBoundary = () => {
    setError(null);
    setRetryCount(prev => prev + 1);
    fetchDashboardData();
  };

  // Global error handler
  const handleError = (error, context = 'Unknown operation') => {
    console.error(`Error in ${context}:`, error);
    
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    // Don't show toast for auto-refresh to avoid spam
    if (!context.includes('auto-refresh')) {
      message.error({
        content: `Error in ${context}: ${errorMessage}`,
        duration: 5,
        key: `error-${context}`
      });
    }
    
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

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardData();

    setupAutoRefresh();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [retryCount]);

  useEffect(() => {
    if (autoRefresh) {
      setupAutoRefresh();
    }
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!user) {
        safeSetState(setCurrentUser, null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      safeSetState(setCurrentUser, { ...user, ...profile });
    } catch (error) {
      handleError(error, 'fetching current user');
    }
  };

  const setupAutoRefresh = () => {
    try {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      if (autoRefresh) {
        refreshIntervalRef.current = setInterval(() => {
          refreshDashboardData();
        }, 1 * 60 * 1000);
      }
    } catch (error) {
      handleError(error, 'setting up auto-refresh');
    }
  };

  const refreshDashboardData = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      safeSetState(setLastRefresh, new Date());
      message.success({
        content: 'Dashboard data updated',
        duration: 2,
        key: 'auto-refresh'
      });
    } catch (error) {
      handleError(error, 'auto-refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      safeSetState(setLastRefresh, new Date());
      message.success('Dashboard refreshed successfully');
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
        setupAutoRefresh();
        message.info('Auto-refresh enabled (every 1 minutes)');
      } else {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        message.info('Auto-refresh disabled');
      }
    } catch (error) {
      handleError(error, 'toggle auto-refresh');
    }
  };



  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAllData(),
        fetchDepartments(),
        fetchCategories(),
        fetchPersonalMeetings()
      ]);
    } catch (error) {
      handleError(error, 'fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch personal meetings
  const fetchPersonalMeetings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;

      const { data, error } = await supabase
        .from('personal_meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      safeSetState(setPersonalMeetings, data || []);
    } catch (error) {
      handleError(error, 'fetching personal meetings');
      safeSetState(setPersonalMeetings, []);
    }
  };

  // Fetch all data from all tables
  const fetchAllData = async () => {
    const allMeetingsData = [];
    const allTasksData = [];

    try {
      // Fetch from all tables with timeout protection
      const fetchPromises = Object.entries(tableCategoryMapping).map(async ([tableName, tableInfo]) => {
        try {
          let query = supabase
            .from(tableName)
            .select(`
              *,
              department:departments(name),
              category:categories(name)
            `)
            .order('created_at', { ascending: false });

          const { data, error } = await query;

          if (error) {
            console.warn(`Error fetching from ${tableName}:`, error);
            return;
          }

          if (data) {
            data.forEach(item => {
              try {
                const itemWithMetadata = {
                  ...item,
                  sourceTable: tableName,
                  type: tableInfo.type,
                  categoryName: tableInfo.categoryName,
                  departmentName: item.department?.name || 'Unknown'
                };

                if (tableInfo.type === 'meeting') {
                  allMeetingsData.push(itemWithMetadata);
                } else {
                  allTasksData.push(itemWithMetadata);
                }
              } catch (itemError) {
                console.warn(`Error processing item from ${tableName}:`, itemError);
              }
            });
          }
        } catch (tableError) {
          console.warn(`Failed to fetch from table ${tableName}:`, tableError);
        }
      });

      await Promise.allSettled(fetchPromises);

      safeSetState(setAllMeetings, allMeetingsData);
      safeSetState(setAllTasks, allTasksData);
      calculateStats(allMeetingsData, allTasksData);
      calculateOrganizationalStats(allMeetingsData, allTasksData);

      if (currentUser) {
        calculatePersonalStats(allMeetingsData, allTasksData, currentUser.id);
      }
    } catch (error) {
      handleError(error, 'fetching all data');
      safeSetState(setAllMeetings, []);
      safeSetState(setAllTasks, []);
    }
  };

  // Helper function to determine the date field name based on table
  const getDateFieldName = (tableName) => {
    try {
      const dateFields = {
        'bdm_customer_visit': 'schedule_date',
        'bdm_principle_visit': 'visit_duration_start',
        'bdm_weekly_meetings': 'date',
        'bdm_college_session': 'start_date',
        'bdm_promotional_activities': 'date',
        'sales_operations_meetings': 'date',
        'sales_operations_tasks': 'start_date',
        'scmt_d_n_d': 'start_date',
        'scmt_meetings_and_sessions': 'date',
        'scmt_others': 'date'
      };
      return dateFields[tableName] || 'created_at';
    } catch (error) {
      console.warn('Error getting date field name:', error);
      return 'created_at';
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data: departmentsData, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;

      safeSetState(setDepartments, departmentsData || []);
    } catch (error) {
      handleError(error, 'fetching departments');
      safeSetState(setDepartments, []);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      safeSetState(setCategories, categoriesData || []);
    } catch (error) {
      handleError(error, 'fetching categories');
      safeSetState(setCategories, []);
    }
  };

  // Helper function to get date field based on table structure
  const getMeetingDate = (item) => {
    try {
      if (!item) return new Date().toISOString();
      
      const dateField = getDateFieldName(item.sourceTable);
      return item[dateField] || item.created_at || new Date().toISOString();
    } catch (error) {
      console.warn('Error getting meeting date:', error);
      return new Date().toISOString();
    }
  };

  // Helper function to get title based on table structure
  const getMeetingTitle = (item) => {
    try {
      if (!item) return 'Unknown Activity';
      
      if (item.title) return item.title;
      if (item.meeting) return item.meeting;
      if (item.college_name) return `${item.college_name} Session`;
      if (item.customer_name) return `Visit: ${item.customer_name}`;
      if (item.principle_name) return `Principle: ${item.principle_name}`;
      if (item.promotional_activity) return item.promotional_activity;
      if (item.type) return item.type;
      if (item.topic) return item.topic; // For personal meetings
      return `${item.categoryName} Activity`;
    } catch (error) {
      console.warn('Error getting meeting title:', error);
      return 'Unknown Activity';
    }
  };

  // Helper to get responsible person name
  const getResponsiblePerson = (item) => {
    try {
      if (!item) return 'Not assigned';
      
      if (item.responsible_bdm) return `BDM: ${item.responsible_bdm_2}`;
      if (item.conducted_by) return `Conducted by: ${item.conducted_by_2}`;
      if (item.responsible) return `Responsible: ${item.responsible_2}`;
      if (item.organizor_id) return `Organizer: ${item.organizor_id_2}`;
      return 'Not assigned';
    } catch (error) {
      console.warn('Error getting responsible person:', error);
      return 'Not assigned';
    }
  };

  const calculateStats = (meetingsData, tasksData) => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const thisWeekMeetings = meetingsData.filter(meeting => {
        try {
          const meetingDate = new Date(getMeetingDate(meeting));
          return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
        } catch (error) {
          console.warn('Error processing meeting date:', error);
          return false;
        }
      });

      const highPriorityMeetings = meetingsData.filter(meeting => meeting.priority >= 4);
      const completedMeetings = meetingsData.filter(meeting => meeting.status === 'completed');
      const pendingTasks = tasksData.filter(task => task.status === 'pending');

      safeSetState(setStats, {
        totalMeetings: meetingsData.length,
        totalTasks: tasksData.length,
        thisWeekMeetings: thisWeekMeetings.length,
        highPriorityMeetings: highPriorityMeetings.length,
        completedMeetings: completedMeetings.length,
        pendingTasks: pendingTasks.length
      });
    } catch (error) {
      handleError(error, 'calculating statistics');
    }
  };

  const calculateOrganizationalStats = (meetingsData, tasksData) => {
    try {
      const departmentMeetingCount = {};
      const departmentTaskCount = {};
      const monthlyData = {};
      let totalCompleted = 0;

      meetingsData.forEach(meeting => {
        try {
          const deptName = meeting.departmentName || 'Unknown';
          const month = new Date(getMeetingDate(meeting)).toLocaleString('default', { month: 'short', year: 'numeric' });

          departmentMeetingCount[deptName] = (departmentMeetingCount[deptName] || 0) + 1;
          monthlyData[month] = (monthlyData[month] || 0) + 1;

          if (meeting.status === 'completed') totalCompleted++;
        } catch (error) {
          console.warn('Error processing meeting for organizational stats:', error);
        }
      });

      tasksData.forEach(task => {
        try {
          const deptName = task.departmentName || 'Unknown';
          departmentTaskCount[deptName] = (departmentTaskCount[deptName] || 0) + 1;
        } catch (error) {
          console.warn('Error processing task for organizational stats:', error);
        }
      });

      const departmentMeetings = Object.entries(departmentMeetingCount).map(([name, count]) => ({
        name,
        meetings: count,
        tasks: departmentTaskCount[name] || 0
      }));

      const monthlyTrend = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        meetings: count
      }));

      const busiestDepartment = Object.entries(departmentMeetingCount).reduce((a, b) =>
        a[1] > b[1] ? a : b, ['', 0]
      )[0];

      safeSetState(setOrganizationalStats, {
        departmentMeetings,
        monthlyTrend,
        completionRate: meetingsData.length > 0 ? (totalCompleted / meetingsData.length) * 100 : 0,
        busiestDepartment
      });
    } catch (error) {
      handleError(error, 'calculating organizational statistics');
    }
  };

  const calculatePersonalStats = async (meetingsData, tasksData, userId) => {
    try {
      const myMeetings = meetingsData.filter(meeting => {
        try {
          return meeting.responsible_bdm === userId ||
            meeting.organizor_id === userId ||
            meeting.responsible === userId ||
            meeting.conducted_by === userId ||
            (meeting.responsible_bdm && Array.isArray(meeting.responsible_bdm) && meeting.responsible_bdm.includes(userId));
        } catch (error) {
          console.warn('Error processing meeting for personal stats:', error);
          return false;
        }
      });

      const myTasks = tasksData.filter(task => {
        try {
          return task.responsible_bdm === userId ||
            task.responsible === userId ||
            task.conducted_by === userId ||
            task.organizor_id === userId;
        } catch (error) {
          console.warn('Error processing task for personal stats:', error);
          return false;
        }
      });

      const today = new Date();
      const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcomingMeetings = myMeetings.filter(meeting => {
        try {
          const meetingDate = new Date(getMeetingDate(meeting));
          return meetingDate >= today && meetingDate <= endOfWeek;
        } catch (error) {
          console.warn('Error processing upcoming meeting:', error);
          return false;
        }
      });

      const highPriorityCount = myMeetings.filter(meeting => meeting.priority >= 4).length;

      // Calculate personal meetings stats
      const personalMeetingsCount = personalMeetings.length;
      const upcomingPersonalMeetings = personalMeetings.filter(meeting => {
        try {
          const meetingDate = new Date(meeting.start_date);
          return meetingDate >= today && meetingDate <= endOfWeek;
        } catch (error) {
          console.warn('Error processing personal meeting date:', error);
          return false;
        }
      }).length;

      safeSetState(setPersonalStats, {
        myMeetings: myMeetings.length,
        myTasks: myTasks.length,
        upcomingMeetings: upcomingMeetings.length,
        highPriorityCount,
        personalMeetingsCount,
        upcomingPersonalMeetings
      });
    } catch (error) {
      handleError(error, 'calculating personal statistics');
    }
  };

  const getPersonalMeetings = () => {
    if (!currentUser) return [];

    try {
      return allMeetings.filter(meeting => {
        try {
          return meeting.responsible_bdm === currentUser.id ||
            meeting.organizor_id === currentUser.id ||
            meeting.responsible === currentUser.id ||
            meeting.conducted_by === currentUser.id ||
            (meeting.responsible_bdm && Array.isArray(meeting.responsible_bdm) && meeting.responsible_bdm.includes(currentUser.id)) ||
            meeting.department_id === currentUser.department_id;
        } catch (error) {
          console.warn('Error filtering personal meeting:', error);
          return false;
        }
      }).slice(0, 10);
    } catch (error) {
      handleError(error, 'getting personal meetings');
      return [];
    }
  };

  const getPersonalTasks = () => {
    if (!currentUser) return [];

    try {
      return allTasks.filter(task => {
        try {
          return task.responsible_bdm === currentUser.id ||
            task.responsible === currentUser.id ||
            task.conducted_by === currentUser.id ||
            task.organizor_id === currentUser.id ||
            task.department_id === currentUser.department_id;
        } catch (error) {
          console.warn('Error filtering personal task:', error);
          return false;
        }
      }).slice(0, 10);
    } catch (error) {
      handleError(error, 'getting personal tasks');
      return [];
    }
  };

  const handleMeetingClick = (meeting) => {
    try {
      safeSetState(setSelectedMeeting, meeting);
      safeSetState(setIsMeetingModalVisible, true);
    } catch (error) {
      handleError(error, 'handling meeting click');
    }
  };

  // Organizational Calendar Cell Render
  const getOrganizationalDateCellRender = (value) => {
    try {
      const listData = allMeetings.filter(meeting => {
        try {
          const meetingDate = dayjs(getMeetingDate(meeting));
          return meetingDate.isSame(value, 'day');
        } catch (error) {
          console.warn('Error processing meeting date for calendar:', error);
          return false;
        }
      });

      const highPriorityCount = listData.filter(meeting => meeting.priority >= 4).length;
      const mediumPriorityCount = listData.filter(meeting => meeting.priority === 3).length;
      const lowPriorityCount = listData.filter(meeting => meeting.priority <= 2).length;

      return (
        <div style={{ padding: '2px' }}>
          {listData.length > 0 && (
            <Badge
              count={listData.length}
              style={{
                backgroundColor: '#1890ff',
                fontSize: '10px',
                marginBottom: '2px'
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {highPriorityCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px' }}>🔴</span>
                <Text style={{ fontSize: '8px' }}>{highPriorityCount}</Text>
              </div>
            )}
            {mediumPriorityCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px' }}>🟡</span>
                <Text style={{ fontSize: '8px' }}>{mediumPriorityCount}</Text>
              </div>
            )}
            {lowPriorityCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontSize: '8px' }}>🟢</span>
                <Text style={{ fontSize: '8px' }}>{lowPriorityCount}</Text>
              </div>
            )}
          </div>

          {listData.length > 0 && (
            <Popover
              content={
                <div style={{ maxWidth: '200px' }}>
                  <Text strong>Meetings on {value.format('MMM D')}:</Text>
                  <ul style={{ paddingLeft: '16px', margin: '8px 0' }}>
                    {listData.map(meeting => (
                      <li key={`${meeting.sourceTable}-${meeting.id}`}>
                        <Text
                          style={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: priorityColors[meeting.priority] || '#666'
                          }}
                          onClick={() => handleMeetingClick(meeting)}
                        >
                          {meeting.priority >= 4 ? '🔴' : meeting.priority >= 3 ? '🟡' : '🟢'}
                          {' '}{getMeetingTitle(meeting)}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              }
              trigger="hover"
            >
              <div style={{ cursor: 'pointer', marginTop: '2px' }}>
                <Text style={{ fontSize: '9px', color: '#666' }}>
                  {listData.length} meeting{listData.length !== 1 ? 's' : ''}
                </Text>
              </div>
            </Popover>
          )}
        </div>
      );
    } catch (error) {
      console.warn('Error rendering organizational calendar cell:', error);
      return <div style={{ padding: '2px' }}>Error</div>;
    }
  };

  // Personal Calendar Cell Render
  const getPersonalDateCellRender = (value) => {
    try {
      const personalMeetingsList = getPersonalMeetings();
      const personalMeetingsData = personalMeetings.filter(meeting => {
        try {
          const meetingDate = dayjs(meeting.start_date);
          return meetingDate.isSame(value, 'day');
        } catch (error) {
          console.warn('Error processing personal meeting date:', error);
          return false;
        }
      });

      const listData = [
        ...personalMeetingsList.filter(meeting => {
          try {
            const meetingDate = dayjs(getMeetingDate(meeting));
            return meetingDate.isSame(value, 'day');
          } catch (error) {
            console.warn('Error processing meeting date for personal calendar:', error);
            return false;
          }
        }),
        ...personalMeetingsData
      ];

      return (
        <div style={{ padding: '2px' }}>
          {listData.length > 0 && (
            <Badge
              count={listData.length}
              style={{
                backgroundColor: '#1890ff',
                fontSize: '10px',
                marginBottom: '2px'
              }}
            />
          )}

          {listData.length > 0 && (
            <Popover
              content={
                <div style={{ maxWidth: '200px' }}>
                  <Text strong>Activities on {value.format('MMM D')}:</Text>
                  <ul style={{ paddingLeft: '16px', margin: '8px 0' }}>
                    {listData.map((item, index) => (
                      <li key={item.id || `${item.sourceTable}-${item.id}-${index}`}>
                        <Text
                          style={{
                            fontSize: '12px',
                            cursor: 'pointer',
                            color: priorityColors[item.priority] || '#666'
                          }}
                          onClick={() => handleMeetingClick(item)}
                        >
                          {item.priority >= 4 ? '🔴' : item.priority >= 3 ? '🟡' : '🟢'}
                          {' '}{getMeetingTitle(item)}
                          {item.sourceTable === 'personal_meetings' && ' (Personal)'}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              }
              trigger="hover"
            >
              <div style={{ cursor: 'pointer', marginTop: '2px' }}>
                <Text style={{ fontSize: '9px', color: '#666' }}>
                  {listData.length} activity{listData.length !== 1 ? 'ies' : ''}
                </Text>
              </div>
            </Popover>
          )}
        </div>
      );
    } catch (error) {
      console.warn('Error rendering personal calendar cell:', error);
      return <div style={{ padding: '2px' }}>Error</div>;
    }
  };

  // Get paginated meetings and tasks
  const getPaginatedMeetings = () => {
    try {
      const startIndex = (meetingsPage - 1) * pageSize;
      return allMeetings.slice(startIndex, startIndex + pageSize);
    } catch (error) {
      handleError(error, 'paginating meetings');
      return [];
    }
  };

  const getPaginatedTasks = () => {
    try {
      const startIndex = (tasksPage - 1) * pageSize;
      return allTasks.slice(startIndex, startIndex + pageSize);
    } catch (error) {
      handleError(error, 'paginating tasks');
      return [];
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

  // Render error state
  if (error && retryCount > 2) {
    return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
  }

  // Render loading state
  if (loading && !isRefreshing) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          message="Dashboard Error"
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

      {/* Auto-refresh Control Bar */}
      <Card
        size="small"
        style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        bodyStyle={{ padding: '8px 16px' }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
          </Col>
          <Col>
            <Space>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> Last updated: {formatTimeSinceLastRefresh()}
              </Text>
              <Button
                icon={<SyncOutlined spin={isRefreshing} />}
                onClick={manualRefresh}
                loading={isRefreshing}
                size="small"
              >
                Refresh Now
              </Button>
              <Switch
                checkedChildren="Auto Refresh On"
                unCheckedChildren="Auto Refresh Off"
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                size="small"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {autoRefresh && (
        <Alert
          message="Auto-refresh Enabled"
          description="Dashboard data will automatically update every 1 minute. You'll see a notification when data is refreshed."
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Organizational Dashboard */}
        <TabPane tab="Organizational View" key="organizational">
          {/* Statistics Row */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Meetings"
                  value={stats.totalMeetings}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: isRefreshing ? '#1890ff' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Tasks"
                  value={stats.totalTasks}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: isRefreshing ? '#1890ff' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="This Week Meetings"
                  value={stats.thisWeekMeetings}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: isRefreshing ? '#1890ff' : '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="High Priority"
                  value={stats.highPriorityMeetings}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: isRefreshing ? '#1890ff' : '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Organizational Calendar and Meetings Panel */}
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card
                title="Organizational Calendar"
                bordered={false}
                extra={
                  <Select
                    value={calendarView}
                    onChange={setCalendarView}
                    style={{ width: 120 }}
                  >
                    <Option value="month">Month</Option>
                  </Select>
                }
              >
                <Calendar
                  cellRender={getOrganizationalDateCellRender}
                  fullscreen={false}
                  mode={calendarView}
                />
                <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <Text strong>Calendar Legend:</Text>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🔴</span>
                      <Text style={{ fontSize: '12px' }}>High Priority (4-5)</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🟡</span>
                      <Text style={{ fontSize: '12px' }}>Medium Priority (3)</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🟢</span>
                      <Text style={{ fontSize: '12px' }}>Low Priority (1-2)</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Meetings & Tasks" bordered={false}>
                <Tabs defaultActiveKey="meetings">
                  <TabPane tab="Meetings" key="meetings">
                    <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                      {getPaginatedMeetings().length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description="No meetings found"
                        />
                      ) : (
                        <List
                          dataSource={getPaginatedMeetings()}
                          renderItem={meeting => (
                            <List.Item
                              actions={[
                                <Tag color={priorityColors[meeting.priority] || 'blue'}>
                                  {priorityLabels[meeting.priority] || 'Normal'}
                                </Tag>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text
                                      strong
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleMeetingClick(meeting)}
                                    >
                                      {getMeetingTitle(meeting)}
                                    </Text>
                                    {meeting.status && (
                                      <Badge status={meeting.status === 'completed' ? 'success' : 'processing'} text={meeting.status} />
                                    )}
                                  </div>
                                }
                                description={
                                  <div>
                                    <div>
                                      <Text type="secondary">
                                        Department: {meeting.departmentName} • Category: {meeting.categoryName}
                                      </Text>
                                    </div>
                                    <div>
                                      <Text type="secondary">
                                        Date: {new Date(getMeetingDate(meeting)).toLocaleDateString()}
                                      </Text>
                                    </div>
                                    {meeting.company && (
                                      <div>
                                        <Text type="secondary">Company: {meeting.company}</Text>
                                      </div>
                                    )}
                                    <div>
                                      <Text type="secondary">
                                        {getResponsiblePerson(meeting)}
                                      </Text>
                                    </div>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Pagination
                        current={meetingsPage}
                        total={allMeetings.length}
                        pageSize={pageSize}
                        onChange={setMeetingsPage}
                        size="small"
                        showSizeChanger={false}
                        showQuickJumper={false}
                        simple
                      />
                    </div>
                  </TabPane>
                  <TabPane tab="Tasks" key="tasks">
                    <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                      {getPaginatedTasks().length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description="No tasks found"
                        />
                      ) : (
                        <List
                          dataSource={getPaginatedTasks()}
                          renderItem={task => (
                            <List.Item
                              actions={[
                                <Tag color={priorityColors[task.priority] || 'blue'}>
                                  {priorityLabels[task.priority] || 'Normal'}
                                </Tag>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<CheckCircleOutlined />} />}
                                title={getMeetingTitle(task)}
                                description={
                                  <div>
                                    <div>
                                      <Text type="secondary">
                                        Department: {task.departmentName} • Category: {task.categoryName}
                                      </Text>
                                    </div>
                                    <div>
                                      <Text type="secondary">
                                        Due: {new Date(getMeetingDate(task)).toLocaleDateString()}
                                      </Text>
                                    </div>
                                    {task.company && (
                                      <div>
                                        <Text type="secondary">
                                          Company: {task.company}
                                        </Text>
                                      </div>
                                    )}
                                    <div>
                                      <Text type="secondary">
                                        {getResponsiblePerson(task)}
                                      </Text>
                                    </div>
                                    {task.status && (
                                      <div>
                                        <Text type="secondary">
                                          Status: <Tag color={statusColors[task.status]}>{task.status}</Tag>
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Pagination
                        current={tasksPage}
                        total={allTasks.length}
                        pageSize={pageSize}
                        onChange={setTasksPage}
                        size="small"
                        showSizeChanger={false}
                        showQuickJumper={false}
                        simple
                      />
                    </div>
                  </TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Personal Dashboard */}
        <TabPane tab="Personal Dashboard" key="personal">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Card
                title="My Schedule Calendar"
                bordered={false}
                extra={
                  <Select
                    value={calendarView}
                    onChange={setCalendarView}
                    style={{ width: 120 }}
                  >
                    <Option value="month">Month</Option>
                  </Select>
                }
              >
                <Calendar
                  cellRender={getPersonalDateCellRender}
                  fullscreen={false}
                  mode={calendarView}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="My Meetings & Tasks" bordered={false} style={{ marginTop: 16 }}>
                <Tabs defaultActiveKey="meetings">
                  <TabPane tab="Meetings" key="meetings">
                    <div style={{ maxHeight: 288, overflowY: 'auto', paddingRight: 8 }}>
                      {getPersonalMeetings().length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description="No personal meetings found"
                        />
                      ) : (
                        <List
                          dataSource={getPersonalMeetings()}
                          renderItem={(meeting) => (
                            <List.Item
                              actions={[
                                <Tag color={priorityColors[meeting.priority] || 'blue'}>
                                  {priorityLabels[meeting.priority] || 'Normal'}
                                </Tag>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<UserOutlined />} />}
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text
                                      strong
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => handleMeetingClick(meeting)}
                                    >
                                      {getMeetingTitle(meeting)}
                                    </Text>
                                    {meeting.status && (
                                      <Badge status={meeting.status === 'completed' ? 'success' : 'processing'} text={meeting.status} />
                                    )}
                                  </div>
                                }
                                description={
                                  <div>
                                    <div>
                                      <Text type="secondary">
                                        Date: {new Date(getMeetingDate(meeting)).toLocaleDateString()}
                                      </Text>
                                    </div>
                                    {meeting.company && (
                                      <div>
                                        <Text type="secondary">Company: {meeting.company}</Text>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  </TabPane>
                  <TabPane tab="Tasks" key="tasks">
                    <div style={{ maxHeight: 288, overflowY: 'auto', paddingRight: 8 }}>
                      {getPersonalTasks().length === 0 ? (
                        <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description="No personal tasks found"
                        />
                      ) : (
                        <List
                          dataSource={getPersonalTasks()}
                          renderItem={(task) => (
                            <List.Item
                              actions={[
                                <Tag color={priorityColors[task.priority] || 'blue'}>
                                  {priorityLabels[task.priority] || 'Normal'}
                                </Tag>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar icon={<CheckCircleOutlined />} />}
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>{getMeetingTitle(task)}</Text>
                                    {task.status && (
                                      <Badge status={task.status === 'done' ? 'success' : 'warning'} text={task.status} />
                                    )}
                                  </div>
                                }
                                description={
                                  <div>
                                    <div>
                                      <Text type="secondary">
                                        Department: {task.departmentName} • Category: {task.categoryName}
                                      </Text>
                                    </div>
                                    <div>
                                      <Text type="secondary">
                                        Due: {new Date(getMeetingDate(task)).toLocaleDateString()}
                                      </Text>
                                    </div>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                    </div>
                  </TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Meeting Detail Modal */}
      <Modal
        title="Meeting Details"
        open={isMeetingModalVisible}
        onCancel={() => setIsMeetingModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsMeetingModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedMeeting ? (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={4}>{getMeetingTitle(selectedMeeting)}</Title>
                <p><strong>Type:</strong> {selectedMeeting.type === 'meeting' ? 'Meeting' : 'Task'}</p>
                <p><strong>Department:</strong> {selectedMeeting.departmentName}</p>
                <p><strong>Category:</strong> {selectedMeeting.categoryName}</p>
                <p><strong>Date:</strong> {new Date(getMeetingDate(selectedMeeting)).toLocaleString()}</p>
              </Col>
              <Col span={12}>
                {selectedMeeting.company && (
                  <p><strong>Company:</strong> {selectedMeeting.company}</p>
                )}
                {selectedMeeting.priority && (
                  <p>
                    <strong>Priority:</strong>{' '}
                    <Tag color={priorityColors[selectedMeeting.priority]}>
                      {priorityLabels[selectedMeeting.priority]}
                    </Tag>
                  </p>
                )}
                {selectedMeeting.status && (
                  <p>
                    <strong>Status:</strong>{' '}
                    <Tag color={statusColors[selectedMeeting.status]}>
                      {selectedMeeting.status}
                    </Tag>
                  </p>
                )}
              </Col>
            </Row>
            {selectedMeeting.description && (
              <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                  <p><strong>Description:</strong> {selectedMeeting.description}</p>
                </Col>
              </Row>
            )}
            {selectedMeeting.remarks && (
              <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                  <p><strong>Remarks:</strong> {selectedMeeting.remarks}</p>
                </Col>
              </Row>
            )}
            {selectedMeeting.objectives && (
              <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                  <p><strong>Objectives:</strong> {selectedMeeting.objectives}</p>
                </Col>
              </Row>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <FrownOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
            <div>Meeting details not available</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
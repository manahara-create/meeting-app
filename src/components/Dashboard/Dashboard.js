import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Button,
  message,
  Modal,
  Space,
  Alert,
  Switch,
  Pagination,
  Spin,
  Empty,
  Result,
  Table,
  Divider,
  DatePicker,
  Tooltip,
  ConfigProvider,
  Select,
  Dropdown,
  Collapse
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  FrownOutlined,
  FilterOutlined,
  EyeOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

dayjs.extend(weekOfYear);

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Priority and status configurations
const priorityColors = {
  1: '#27ae60',
  2: '#52c41a',
  3: '#faad14',
  4: '#fa8c16',
  5: '#e74c3c'
};

const priorityLabels = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Critical',
  5: 'Urgent'
};

const statusColors = {
  scheduled: '#3498db',
  completed: '#27ae60',
  cancelled: '#e74c3c',
  pending: '#f39c12',
  in_progress: '#3498db'
};

// Departments configuration
const departments = {
  BDM: { name: 'BDM', color: '#3498db' },
  CLUSTER_1: { name: 'Cluster 1', color: '#e74c3c' },
  CLUSTER_2: { name: 'Cluster 2', color: '#9b59b6' },
  CLUSTER_3: { name: 'Cluster 3', color: '#34495e' },
  CLUSTER_4: { name: 'Cluster 4', color: '#e67e22' },
  CLUSTER_5: { name: 'Cluster 5', color: '#1abc9c' },
  CLUSTER_6: { name: 'Cluster 6', color: '#d35400' },
  CUSTOMER_CARE: { name: 'Customer Care', color: '#27ae60' },
  E_HEALTHCARE: { name: 'E-Healthcare', color: '#8e44ad' },
  HI_TECH: { name: 'Hi-Tech', color: '#f39c12' },
  HR: { name: 'HR', color: '#16a085' },
  IMPORTS: { name: 'Imports', color: '#c0392b' },
  REGULATORY: { name: 'Regulatory', color: '#7f8c8d' },
  SALES_OPERATIONS: { name: 'Sales Operations', color: '#2c3e50' },
  SOMT: { name: 'SOMT', color: '#d35400' },
  STORES: { name: 'Stores', color: '#27ae60' },
  SURGI_IMAGING: { name: 'Surgi Imaging', color: '#2980b9' },
  SURGI_SURGICARE: { name: 'Surgi Surgicare', color: '#8e44ad' }
};

// Simplified table mapping for organizational_data
const tableCategoryMapping = {
  'organizational_data': { 
    type: 'event', 
    categoryName: 'Organizational Event', 
    department: 'ORGANIZATION', 
    shortName: 'Event' 
  }
};

// Simplified helper function to get date field
const getDateFieldName = (tableName) => {
  const dateFields = {
    'organizational_data': 'date'
  };
  
  return dateFields[tableName] || 'date';
};

// Category Overview Modal Component
const CategoryOverviewModal = ({ 
  visible, 
  onClose, 
  selectedDate, 
  groupedActivities,
  onCategorySelect 
}) => {
  const categories = Object.entries(groupedActivities).map(([category, activities]) => ({
    category,
    count: activities.length,
    department: activities[0]?.department,
    color: departments[activities[0]?.department]?.color || '#1890ff'
  }));

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          Categories for {selectedDate?.format('MMMM D, YYYY')}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Close
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Categories"
                value={categories.length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Total Activities"
                value={Object.values(groupedActivities).reduce((sum, activities) => sum + activities.length, 0)}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title="Departments"
                value={new Set(categories.map(cat => cat.department)).size}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        <List
          dataSource={categories}
          renderItem={item => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  onClick={() => onCategorySelect(item.category, groupedActivities[item.category])}
                >
                  View Events ({item.count})
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: item.color,
                      borderRadius: '3px'
                    }}
                  />
                }
                title={item.category}
                description={departments[item.department]?.name || item.department}
              />
              <Tag color="blue">{item.count} activities</Tag>
            </List.Item>
          )}
          locale={{
            emptyText: 'No categories found for this date'
          }}
        />
      </Space>
    </Modal>
  );
};

// Category Events Modal Component
const CategoryEventsModal = ({ 
  visible, 
  onClose, 
  selectedCategory, 
  categoryActivities,
  onEventClick 
}) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color={type === 'meeting' ? 'blue' : 'green'}>
          {type === 'meeting' ? 'Meeting' : 'Event'}
        </Tag>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Button
          type="link"
          onClick={() => onEventClick(record)}
          style={{ padding: 0, height: 'auto', textAlign: 'left', fontSize: '14px' }}
        >
          {title}
        </Button>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => (
        <Text>{new Date(date).toLocaleDateString()}</Text>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          {selectedCategory} ({categoryActivities.length} events)
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Close
        </Button>
      ]}
    >
      <Table
        columns={columns}
        dataSource={categoryActivities}
        pagination={{
          pageSize: 10,
          showSizeChanger: false
        }}
        scroll={{ y: 400 }}
        size="middle"
        locale={{
          emptyText: 'No events found for this category'
        }}
      />
    </Modal>
  );
};

// Enhanced Calendar Component - Shows Event Titles
const SimplifiedCalendar = ({
  activities,
  onDateClick,
  selectedDate,
  currentMonth,
  onMonthChange,
  onEventClick,
  viewMode,
  onViewModeChange,
  onShowAllCategories
}) => {
  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.year();
    const month = date.month();
    return new Date(year, month + 1, 0).getDate();
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  // Get activity titles for a date
  const getActivityTitlesForDate = (date) => {
    const dateActivities = getActivitiesForDate(date);
    
    return dateActivities.map(activity => ({
      id: activity.id,
      title: activity.title || 'Untitled Event',
      type: activity.type,
      department: activity.department,
      priority: activity.priority,
      fullActivity: activity
    }));
  };

  // Get color based on activity type and priority
  const getActivityColor = (activity) => {
    const { type, priority } = activity;
    
    // Color based on type and priority
    const colorSchemes = {
      event: {
        1: { background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', text: '#1565c0', border: '#90caf9' },
        2: { background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)', text: '#2e7d32', border: '#a5d6a7' },
        3: { background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', text: '#ef6c00', border: '#ffb74d' },
        4: { background: 'linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%)', text: '#d84315', border: '#ff8a65' },
        5: { background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', text: '#c62828', border: '#ef5350' }
      }
    };

    return colorSchemes[type]?.[priority] || colorSchemes.event[3];
  };

  // Truncate title for display
  const truncateTitle = (title, maxLength = 20) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  // Render month view with activity titles
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = currentMonth.startOf('month').day();
    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(
        <td key={`empty-${i}`} className="calendar-empty-cell" style={{
          background: 'linear-gradient(135deg, #fafafa 0%, #e0e0e0 100%)',
          opacity: 0.6,
          borderRadius: '4px'
        }}></td>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day);
      const dateActivities = getActivitiesForDate(date.toDate());
      const activityTitles = getActivityTitlesForDate(date.toDate());
      const isToday = date.isSame(dayjs(), 'day');
      const isSelected = selectedDate && date.isSame(selectedDate, 'day');
      const isWeekend = date.day() === 0 || date.day() === 6;

      currentWeek.push(
        <td key={day} style={{
          border: '1px solid #e8e8e8',
          verticalAlign: 'top',
          height: '120px',
          backgroundColor: isToday ? '#e6f7ff' : (isWeekend ? '#fafafa' : 'white'),
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '4px',
          borderWidth: isToday ? '2px' : '1px',
          borderColor: isToday ? '#1890ff' : '#e8e8e8'
        }}>
          {/* Background pattern for days with events */}
          {activityTitles.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '0',
              height: '0',
              borderStyle: 'solid',
              borderWidth: '0 16px 16px 0',
              borderColor: 'transparent #1890ff transparent transparent',
              opacity: 0.3,
              zIndex: 1
            }}></div>
          )}
          
          <div
            onClick={() => onDateClick(date, dateActivities)}
            style={{ 
              cursor: 'pointer', 
              height: '100%', 
              padding: '4px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div style={{ 
              textAlign: 'center', 
              fontWeight: 'bold', 
              marginBottom: '4px',
              fontSize: isToday ? '14px' : '13px',
              color: isToday ? '#1890ff' : (isWeekend ? '#ff4d4f' : '#333'),
              background: isToday ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
              borderRadius: '10px',
              padding: '2px 0'
            }}>
              {day}
            </div>
            
            <div style={{ 
              maxHeight: '80px', 
              overflowY: 'auto',
              fontSize: '9px',
              lineHeight: '1.2'
            }}>
              {activityTitles.slice(0, 4).map((activity, index) => {
                const colors = getActivityColor(activity);
                return (
                  <div
                    key={activity.id}
                    style={{
                      padding: '2px 3px',
                      margin: '1px 0',
                      background: colors.background,
                      color: colors.text,
                      borderRadius: '3px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontWeight: '500',
                      border: `1px solid ${colors.border}`,
                      fontSize: '8px',
                      lineHeight: '1.1',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(activity.fullActivity);
                    }}
                    title={activity.title} // Show full title on hover
                  >
                    {truncateTitle(activity.title, 18)}
                  </div>
                );
              })}
              
              {activityTitles.length > 4 && (
                <div 
                  style={{
                    fontSize: '8px',
                    padding: '1px 3px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '3px',
                    textAlign: 'center',
                    marginTop: '2px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowAllCategories(date, 
                      Object.groupBy(dateActivities, activity => activity.title || 'Untitled Event')
                    );
                  }}
                >
                  +{activityTitles.length - 4} more
                </div>
              )}
            </div>
          </div>
        </td>
      );

      // Start new week when we reach Sunday
      if ((firstDay + day) % 7 === 0) {
        weeks.push(<tr key={weeks.length}>{currentWeek}</tr>);
        currentWeek = [];
      }
    }

    // Add empty cells for remaining days in the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(
          <td key={`empty-end-${currentWeek.length}`} style={{
            background: 'linear-gradient(135deg, #fafafa 0%, #e0e0e0 100%)',
            opacity: 0.6,
            borderRadius: '4px'
          }}></td>
        );
      }
      weeks.push(<tr key={weeks.length}>{currentWeek}</tr>);
    }

    return weeks;
  };

  // Render week view with activity titles
  const renderWeekView = () => {
    const startOfWeek = currentMonth.startOf('week');
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day');
      const dateActivities = getActivitiesForDate(date.toDate());
      const activityTitles = getActivityTitlesForDate(date.toDate());
      const isToday = date.isSame(dayjs(), 'day');
      const isSelected = selectedDate && date.isSame(selectedDate, 'day');
      const isWeekend = date.day() === 0 || date.day() === 6;

      days.push(
        <td key={i} style={{ 
          width: '14.28%',
          border: '1px solid #e8e8e8',
          verticalAlign: 'top',
          height: '400px',
          backgroundColor: isToday ? '#e6f7ff' : (isWeekend ? '#fafafa' : 'white'),
          position: 'relative',
          borderRadius: '4px',
          borderWidth: isToday ? '2px' : '1px',
          borderColor: isToday ? '#1890ff' : '#e8e8e8'
        }}>
          <div
            onClick={() => onDateClick(date, dateActivities)}
            style={{ 
              cursor: 'pointer', 
              height: '100%', 
              padding: '8px',
              position: 'relative'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: `1px solid ${isToday ? '#1890ff' : (isWeekend ? '#ffa39e' : '#f0f0f0')}`
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: isToday ? '#1890ff' : (isWeekend ? '#ff4d4f' : '#666'),
                fontWeight: 'bold'
              }}>
                {date.format('ddd')}
              </div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: isToday ? '#1890ff' : (isWeekend ? '#ff4d4f' : '#333'),
                background: isToday ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {date.date()}
              </div>
            </div>
            
            <div style={{ 
              maxHeight: '340px', 
              overflowY: 'auto',
              fontSize: '10px',
              lineHeight: '1.3'
            }}>
              {activityTitles.slice(0, 10).map((activity, index) => {
                const colors = getActivityColor(activity);
                return (
                  <div
                    key={activity.id}
                    style={{
                      padding: '4px 6px',
                      margin: '3px 0',
                      background: colors.background,
                      color: colors.text,
                      borderRadius: '4px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: '500',
                      border: `1px solid ${colors.border}`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(2px)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(activity.fullActivity);
                    }}
                    title={`${activity.title} (Event)`}
                  >
                    {truncateTitle(activity.title, 25)}
                    <div style={{
                      fontSize: '8px',
                      opacity: 0.8,
                      marginTop: '1px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>📅</span>
                      <span>{priorityLabels[activity.priority]}</span>
                    </div>
                  </div>
                );
              })}
              
              {activityTitles.length > 10 && (
                <div 
                  style={{
                    fontSize: '10px',
                    padding: '6px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '4px',
                    textAlign: 'center',
                    marginTop: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowAllCategories(date, 
                      Object.groupBy(dateActivities, activity => activity.title || 'Untitled Event')
                    );
                  }}
                >
                  +{activityTitles.length - 10} more events
                </div>
              )}
            </div>
          </div>
        </td>
      );
    }

    return [<tr key="week">{days}</tr>];
  };

  // Render day view with activity titles
  const renderDayView = () => {
    const date = selectedDate || currentMonth;
    const dateActivities = getActivitiesForDate(date.toDate());
    const activityTitles = getActivityTitlesForDate(date.toDate());
    const isToday = date.isSame(dayjs(), 'day');

    return [
      <tr key="day">
        <td style={{ 
          height: '500px', 
          padding: '0',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <div style={{ 
            padding: '20px',
            height: '100%',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            margin: '4px'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                {date.format('dddd')}
              </div>
              <div style={{ fontSize: '20px' }}>
                {date.format('MMMM D, YYYY')}
              </div>
              {isToday && (
                <div style={{
                  fontSize: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  marginTop: '6px',
                  display: 'inline-block'
                }}>
                  Today
                </div>
              )}
            </div>
            
            <div>
              {activityTitles.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                    No events scheduled
                  </div>
                </div>
              ) : (
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {activityTitles.map((activity, index) => {
                    const colors = getActivityColor(activity);
                    return (
                      <Card
                        key={activity.id}
                        size="small"
                        style={{
                          cursor: 'pointer',
                          marginBottom: '8px',
                          background: colors.background,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px'
                        }}
                        bodyStyle={{ padding: '12px' }}
                        onClick={() => onEventClick(activity.fullActivity)}
                      >
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          {activity.title}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '11px',
                          opacity: 0.9
                        }}>
                          <span>
                            📅 Event
                          </span>
                          <span>
                            Priority: {priorityLabels[activity.priority]}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    ];
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderView = () => {
    switch (viewMode) {
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  const getHeaderText = () => {
    switch (viewMode) {
      case 'week':
        return `Week of ${currentMonth.startOf('week').format('MMM D')} - ${currentMonth.endOf('week').format('MMM D, YYYY')}`;
      case 'day':
        const date = selectedDate || currentMonth;
        return date.format('dddd, MMMM D, YYYY');
      default:
        return currentMonth.format('MMMM YYYY');
    }
  };

  const navigateView = (direction) => {
    switch (viewMode) {
      case 'week':
        onMonthChange(currentMonth.add(direction, 'week'));
        break;
      case 'day':
        onMonthChange(currentMonth.add(direction, 'day'));
        break;
      default:
        onMonthChange(currentMonth.add(direction, 'month'));
    }
  };

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <Text strong>Organizational Calendar</Text>
          <Select
            value={viewMode}
            onChange={onViewModeChange}
            size="small"
            style={{ width: 120 }}
          >
            <Option value="month">Month View</Option>
            <Option value="week">Week View</Option>
            <Option value="day">Day View</Option>
          </Select>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={() => navigateView(-1)}
            size="small"
          />
          <Text strong>{getHeaderText()}</Text>
          <Button
            icon={<RightOutlined />}
            onClick={() => navigateView(1)}
            size="small"
          />
          <Button
            onClick={() => {
              const now = dayjs();
              onMonthChange(now);
              if (viewMode === 'day') {
                onDateClick(now, getActivitiesForDate(now.toDate()));
              }
            }}
            size="small"
          >
            Today
          </Button>
        </Space>
      }
      bordered={false}
    >
      <div className="simplified-calendar">
        {viewMode !== 'day' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {weekDays.map(day => (
                  <th key={day} style={{
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: '#fafafa',
                    border: '1px solid #e8e8e8',
                    fontWeight: 'bold'
                  }}>
                    {viewMode === 'week' ? day : day.substring(0, 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderView()}
            </tbody>
          </table>
        )}

        {viewMode === 'day' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {renderView()}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
};

// Enhanced Recent Activities Component with Arrow Pagination
const RecentActivities = ({ activities, onActivityClick, onViewAll }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const currentActivities = activities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(activities.length / pageSize);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <Text strong>Recent Events</Text>
        </Space>
      }
      bordered={false}
      extra={
        <Space>
          <Tag color="blue">
            {activities.length} Total
          </Tag>
          {activities.length > pageSize && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={onViewAll}
              size="small"
            >
              View All
            </Button>
          )}
        </Space>
      }
    >
      <div style={{ minHeight: '400px', position: 'relative' }}>
        {currentActivities.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No events found"
          />
        ) : (
          <>
            <List
              dataSource={currentActivities}
              renderItem={activity => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer'
                  }}
                  onClick={() => onActivityClick(activity)}
                  actions={[
                    <Tag
                      color={priorityColors[activity.priority] || 'blue'}
                      style={{ fontSize: '12px', padding: '2px 6px' }}
                    >
                      {priorityLabels[activity.priority] || 'Normal'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          lineHeight: '1.4',
                          display: 'block'
                        }}
                      >
                        {activity.title || 'Untitled Event'}
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(activity.date).toLocaleDateString()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            {/* Enhanced Pagination with Arrows */}
            {activities.length > pageSize && (
              <div style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '16px'
              }}>
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <Text style={{ color: '#666' }}>
                  Page {currentPage} of {totalPages}
                </Text>

                <Button
                  type="text"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <RightOutlined />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

// Department Filter Component
const DepartmentFilter = ({ selectedDepartment, onDepartmentChange }) => {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Space wrap>
        <Text strong style={{ fontSize: '16px' }}>Filter by Department:</Text>
        <Select
          value={selectedDepartment}
          onChange={onDepartmentChange}
          style={{ width: 250 }}
          placeholder="Select Department"
          allowClear
          size="large"
        >
          {Object.entries(departments).map(([key, dept]) => (
            <Option key={key} value={key}>
              <Space>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: dept.color,
                    borderRadius: '2px'
                  }}
                />
                {dept.name}
              </Space>
            </Option>
          ))}
        </Select>
        <Button
          onClick={() => onDepartmentChange(null)}
          size="large"
        >
          Show All Departments
        </Button>
      </Space>
    </Card>
  );
};

// Export functionality
const ExportButton = ({ activities, currentView, currentDate, selectedDepartment }) => {
  const exportToExcel = () => {
    try {
      const dataForExport = activities.map(activity => ({
        'Title': activity.title || 'Untitled Event',
        'Date': new Date(activity.date).toLocaleDateString(),
        'Priority': priorityLabels[activity.priority],
        'Status': activity.status || 'scheduled'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');

      const fileName = `calendar_export_${currentView}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(16);
      doc.text('Organizational Calendar Export', 14, 15);
      doc.setFontSize(10);
      doc.text(`View: ${currentView} | Generated: ${dayjs().format('MMMM D, YYYY h:mm A')}`, 14, 22);

      // Prepare table data manually without autoTable
      const headers = ['Title', 'Date', 'Priority'];
      const tableData = activities.map(activity => [
        activity.title?.substring(0, 25) || 'Untitled Event',
        new Date(activity.date).toLocaleDateString(),
        priorityLabels[activity.priority]
      ]);

      // Simple table implementation
      let yPosition = 35;
      const lineHeight = 7;
      const colWidths = [60, 30, 20];
      const pageHeight = doc.internal.pageSize.height;

      // Draw headers
      doc.setFillColor(52, 152, 219);
      doc.setTextColor(255, 255, 255);
      let xPosition = 14;

      headers.forEach((header, index) => {
        doc.rect(xPosition, yPosition - 5, colWidths[index], 8, 'F');
        doc.text(header, xPosition + 2, yPosition);
        xPosition += colWidths[index];
      });

      yPosition += 10;
      doc.setTextColor(0, 0, 0);

      // Draw rows
      tableData.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        xPosition = 14;
        row.forEach((cell, cellIndex) => {
          doc.text(cell.toString(), xPosition + 2, yPosition);
          xPosition += colWidths[cellIndex];
        });

        // Draw line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPosition + 2, 14 + colWidths.reduce((a, b) => a + b, 0), yPosition + 2);

        yPosition += lineHeight;
      });

      const fileName = `calendar_export_${currentView}_${dayjs().format('YYYY-MM-DD')}.pdf`;
      doc.save(fileName);

      toast.success('PDF file exported successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF file');
    }
  };

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
    <Dropdown menu={{ items: exportItems }} placement="bottomRight">
      <Button type="primary" icon={<DownloadOutlined />} size="large">
        Export
      </Button>
    </Dropdown>
  );
};

// All Activities Modal Component
const AllActivitiesModal = ({
  visible,
  onClose,
  activities,
  onActivityClick
}) => {
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type) => (
        <Tag color="blue">Event</Tag>
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Button
          type="link"
          onClick={() => onActivityClick(record)}
          style={{ padding: 0, height: 'auto', textAlign: 'left' }}
        >
          {title || 'Untitled Event'}
        </Button>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => (
        <Text>{new Date(date).toLocaleDateString()}</Text>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          All Events ({activities.length})
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Close
        </Button>
      ]}
    >
      <Table
        columns={columns}
        dataSource={activities}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        scroll={{ y: 600 }}
        size="middle"
        locale={{
          emptyText: 'No events found'
        }}
      />
    </Modal>
  );
};

// Activity Detail Modal Component
const ActivityDetailModal = ({
  visible,
  onClose,
  selectedActivity
}) => {
  if (!selectedActivity) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      title="Event Details"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Close
        </Button>
      ]}
      width={600}
    >
      <div style={{ fontSize: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {selectedActivity.title || 'Untitled Event'}
            </Title>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Type: </Text>
            <Tag color="blue" style={{ fontSize: '14px' }}>
              Event
            </Tag>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Priority: </Text>
            <Tag color={priorityColors[selectedActivity.priority]} style={{ fontSize: '14px' }}>
              {priorityLabels[selectedActivity.priority]}
            </Tag>
          </Col>
          <Col xs={24}>
            <Text strong>Date: </Text>
            <Text>{formatDate(selectedActivity.date)}</Text>
          </Col>
          {selectedActivity.status && (
            <Col xs={24} sm={12}>
              <Text strong>Status: </Text>
              <Tag color={statusColors[selectedActivity.status]} style={{ fontSize: '14px' }}>
                {selectedActivity.status}
              </Tag>
            </Col>
          )}
        </Row>

        {selectedActivity.description && (
          <>
            <Divider />
            <Row>
              <Col span={24}>
                <Text strong>Description: </Text>
                <Text style={{ display: 'block', marginTop: '8px' }}>
                  {selectedActivity.description}
                </Text>
              </Col>
            </Row>
          </>
        )}
      </div>
    </Modal>
  );
};

// Loading component
const LoadingSpinner = ({ tip = "Loading dashboard data..." }) => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" tip={tip} />
  </div>
);

// Main Dashboard Component
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // Modal states
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [allActivitiesModalVisible, setAllActivitiesModalVisible] = useState(false);
  
  // New modal states for layered approach
  const [categoryOverviewModalVisible, setCategoryOverviewModalVisible] = useState(false);
  const [categoryEventsModalVisible, setCategoryEventsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryActivities, setSelectedCategoryActivities] = useState([]);
  const [tempGroupedActivities, setTempGroupedActivities] = useState({});
  const [tempSelectedDate, setTempSelectedDate] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalActivities: 0,
    thisWeekActivities: 0,
    highPriorityActivities: 0,
    completedActivities: 0,
    pendingActivities: 0
  });

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser({ ...user, ...profile });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await fetchAllActivities();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const manualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
      toast.success('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAllActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('organizational_data')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching organizational data:', error);
        throw error;
      }

      const activitiesData = data.map(item => ({
        ...item,
        sourceTable: 'organizational_data',
        type: 'event',
        categoryName: 'Organizational Event',
        department: 'ORGANIZATION',
        start: item.date,
        title: item.title || 'Untitled Event',
        priority: item.priority || 3,
        status: item.status || 'scheduled',
        hasTime: false
      }));

      setAllActivities(activitiesData);
      calculateStats(activitiesData);
      
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw error;
    }
  };

  const calculateStats = (activitiesData) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekActivities = activitiesData.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });

    const highPriorityActivities = activitiesData.filter(activity => activity.priority >= 4);
    const completedActivities = activitiesData.filter(activity => activity.status === 'completed');
    const pendingActivities = activitiesData.filter(activity => activity.status === 'pending');

    setStats({
      totalActivities: activitiesData.length,
      thisWeekActivities: thisWeekActivities.length,
      highPriorityActivities: highPriorityActivities.length,
      completedActivities: completedActivities.length,
      pendingActivities: pendingActivities.length
    });
  };

  // Get filtered activities based on department
  const getFilteredActivities = () => {
    // Since we only have one table now, department filter might not be relevant
    // but keeping it for consistency
    if (!selectedDepartment) {
      return allActivities;
    }

    return allActivities.filter(activity => activity.department === selectedDepartment);
  };

  const handleDateClick = (date, activities = []) => {
    setSelectedDate(date);
  };

  const handleEventClick = (activity) => {
    // Close any open modals first
    setCategoryOverviewModalVisible(false);
    setCategoryEventsModalVisible(false);
    setAllActivitiesModalVisible(false);
    
    setSelectedActivity(activity);
    setIsActivityModalVisible(true);
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setIsActivityModalVisible(true);
  };

  const handleShowAllCategories = (date, groupedActivities) => {
    // Close any open modals first
    setCategoryEventsModalVisible(false);
    setIsActivityModalVisible(false);
    setAllActivitiesModalVisible(false);
    
    setTempSelectedDate(date);
    setTempGroupedActivities(groupedActivities);
    setCategoryOverviewModalVisible(true);
  };

  const handleCategorySelect = (category, activities) => {
    // Close category overview modal
    setCategoryOverviewModalVisible(false);
    
    setSelectedCategory(category);
    setSelectedCategoryActivities(activities);
    setCategoryEventsModalVisible(true);
  };

  const handleMonthChange = (newDate) => {
    setCurrentMonth(newDate);
    if (viewMode === 'day') {
      setSelectedDate(newDate);
    }
  };

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    if (newViewMode === 'day' && !selectedDate) {
      setSelectedDate(currentMonth);
    }
  };

  const formatTimeSinceLastRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefresh) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ConfigProvider>
      <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
        <ToastContainer position="top-right" autoClose={5000} />

        {/* Header with Controls */}
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Title level={2} style={{ margin: 0, fontSize: '24px' }}>Dashboard</Title>
              {currentUser && (
                <Text type="secondary">Welcome, {currentUser.full_name || currentUser.email}</Text>
              )}
            </Col>
            <Col xs={24} sm={12} md={6}>
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
                  <ExportButton
                    activities={getFilteredActivities()}
                    currentView={viewMode}
                    currentDate={currentMonth}
                    selectedDepartment={selectedDepartment}
                  />
                  <Switch
                    checkedChildren="Auto On"
                    unCheckedChildren="Auto Off"
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                  />
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        {autoRefresh && (
          <Alert
            message="Auto-refresh Enabled"
            description="Dashboard data will automatically update periodically."
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Statistics Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Total Events"
                value={stats.totalActivities}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="This Week"
                value={stats.thisWeekActivities}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="High Priority"
                value={stats.highPriorityActivities}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#f5222d', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Completed"
                value={stats.completedActivities}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Pending"
                value={stats.pendingActivities}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <SimplifiedCalendar
              activities={getFilteredActivities()}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              onEventClick={handleEventClick}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onShowAllCategories={handleShowAllCategories}
            />
          </Col>

          <Col xs={24} lg={8}>
            <RecentActivities
              activities={getFilteredActivities()}
              onActivityClick={handleActivityClick}
              onViewAll={() => setAllActivitiesModalVisible(true)}
            />
          </Col>
        </Row>

        {/* Category Overview Modal */}
        <CategoryOverviewModal
          visible={categoryOverviewModalVisible}
          onClose={() => setCategoryOverviewModalVisible(false)}
          selectedDate={tempSelectedDate}
          groupedActivities={tempGroupedActivities}
          onCategorySelect={handleCategorySelect}
        />

        {/* Category Events Modal */}
        <CategoryEventsModal
          visible={categoryEventsModalVisible}
          onClose={() => setCategoryEventsModalVisible(false)}
          selectedCategory={selectedCategory}
          categoryActivities={selectedCategoryActivities}
          onEventClick={handleEventClick}
        />

        {/* All Activities Modal */}
        <AllActivitiesModal
          visible={allActivitiesModalVisible}
          onClose={() => setAllActivitiesModalVisible(false)}
          activities={getFilteredActivities()}
          onActivityClick={handleActivityClick}
        />

        {/* Activity Detail Modal */}
        <ActivityDetailModal
          visible={isActivityModalVisible}
          onClose={() => setIsActivityModalVisible(false)}
          selectedActivity={selectedActivity}
        />
      </div>
    </ConfigProvider>
  );
};

export default Dashboard;
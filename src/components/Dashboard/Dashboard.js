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
  Segmented,
  Divider,
  DatePicker,
  Tooltip,
  Image
} from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SearchOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FrownOutlined,
  AppstoreOutlined,
  BarsOutlined,
  FilterOutlined,
  EyeOutlined,
  LeftOutlined,
  RightOutlined,
  IdcardOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

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

// Department configuration
const departments = {
  BDM: { name: 'BDM', color: '#3498db' },
  SCMT: { name: 'SCMT', color: '#27ae60' },
  SALES_OPERATIONS: { name: 'Sales Operations', color: '#f39c12' }
};

// Table to category mapping
const tableCategoryMapping = {
  // BDM Department Tables
  'bdm_customer_visit': { type: 'task', categoryName: 'Customer Visit', department: 'BDM' },
  'bdm_principle_visit': { type: 'task', categoryName: 'Principle Visit', department: 'BDM' },
  'bdm_weekly_meetings': { type: 'meeting', categoryName: 'Weekly Meetings', department: 'BDM' },
  'bdm_college_session': { type: 'meeting', categoryName: 'College Session', department: 'BDM' },
  'bdm_promotional_activities': { type: 'task', categoryName: 'Promotional Activities', department: 'BDM' },
  
  // Sales Operations Department Tables
  'sales_operations_meetings': { type: 'meeting', categoryName: 'Meetings', department: 'SALES_OPERATIONS' },
  'sales_operations_tasks': { type: 'task', categoryName: 'Special Tasks', department: 'SALES_OPERATIONS' },
  
  // SCMT Department Tables
  'scmt_d_n_d': { type: 'task', categoryName: 'Delivery and Distributions', department: 'SCMT' },
  'scmt_meetings_and_sessions': { type: 'meeting', categoryName: 'Meetings and Sessions', department: 'SCMT' },
  'scmt_others': { type: 'task', categoryName: 'Other Operation Activities', department: 'SCMT' },
  'scmt_weekly_meetings': { type: 'task', categoryName: 'Other Weekly Shipments', department: 'SCMT' }
};

// Enhanced FullCalendar Component
const EnhancedFullCalendar = React.memo(({ 
  events, 
  onDateClick, 
  onEventClick,
  view = 'dayGridMonth',
  height = '600px',
  dateRange = null
}) => {
  const calendarRef = useRef(null);

  // Calculate activity count per day for coloring
  const getActivityCountColor = (date) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
    
    const count = dayEvents.length;
    
    if (count === 0) return 'transparent';
    if (count <= 3) return '#27ae60'; // Green
    if (count <= 6) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  // Get event color based on activity count (overriding priority-based colors)
  const getEventColor = (event) => {
    const eventDate = new Date(event.start);
    return getActivityCountColor(eventDate);
  };

  // Get event text color based on background
  const getEventTextColor = (backgroundColor) => {
    if (backgroundColor === 'transparent') return '#000';
    return '#ffffff'; // White text for colored backgrounds
  };

  const handleDateClick = (arg) => {
    if (onDateClick) {
      onDateClick(arg.date, arg);
    }
  };

  const handleEventClick = (arg) => {
    if (onEventClick) {
      onEventClick(arg.event);
    }
  };

  // Filter events based on date range
  const getFilteredEvents = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return events;
    }
    
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);
    endDate.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div style={{ 
      border: '1px solid #e8e8e8', 
      borderRadius: '16px', 
      padding: '20px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
        initialView={view}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        height={height}
        events={filteredEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventColor={(event) => getEventColor(event)}
        eventTextColor={(event) => getEventTextColor(getEventColor(event))}
        eventDisplay="block"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short'
        }}
        dayMaxEvents={3}
        moreLinkText={`more`}
        views={{
          dayGridMonth: {
            dayMaxEventRows: 3,
          },
          timeGridWeek: {
            dayMaxEventRows: 3,
          },
          timeGridDay: {
            dayMaxEventRows: 6,
          }
        }}
        eventContent={(eventInfo) => {
          const eventDate = new Date(eventInfo.event.start);
          const dayEvents = events.filter(event => {
            const currentEventDate = new Date(event.start);
            return currentEventDate.toDateString() === eventDate.toDateString();
          });
          const activityCount = dayEvents.length;

          return (
            <div style={{
              padding: '4px 6px',
              fontSize: '12px',
              fontWeight: 'bold',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              borderRadius: '4px'
            }}>
              <div>{eventInfo.event.title}</div>
              <div style={{ 
                fontSize: '10px', 
                opacity: 0.9,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2px'
              }}>
                <span>{eventInfo.timeText}</span>
                <Tooltip title={`${activityCount} activities on this day`}>
                  <span style={{ 
                    marginLeft: '4px',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '1px 4px',
                    fontSize: '8px',
                    fontWeight: 'bold'
                  }}>
                    {activityCount}
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        }}
        dayCellContent={(cellInfo) => {
          const date = cellInfo.date;
          const today = new Date();
          const tenDaysFromYesterday = new Date();
          tenDaysFromYesterday.setDate(today.getDate() - 1 + 10);
          
          const isDefaultRange = date >= today && date <= tenDaysFromYesterday;
          const activityCountColor = getActivityCountColor(date);
          const hasActivities = activityCountColor !== 'transparent';

          return (
            <div style={{
              textAlign: 'center',
              fontWeight: isDefaultRange ? 'bold' : 'normal',
              color: isDefaultRange ? '#3498db' : 'inherit',
              backgroundColor: hasActivities ? activityCountColor : (isDefaultRange ? '#e6f7ff' : 'transparent'),
              borderRadius: '8px',
              padding: '6px',
              border: hasActivities ? '2px solid #fff' : 'none',
              boxShadow: hasActivities ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              margin: '2px'
            }}>
              {date.getDate()}
            </div>
          );
        }}
      />
    </div>
  );
});

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
          <CalendarOutlined style={{ color: '#3498db' }} />
          <Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '16px' }}>
            Recent Activities
          </Text>
        </Space>
      }
      bordered={false}
      style={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
        border: 'none'
      }}
      extra={
        <Space>
          <Badge 
            count={activities.length} 
            style={{ 
              backgroundColor: '#3498db',
              boxShadow: '0 0 0 2px #fff'
            }} 
          />
          {activities.length > pageSize && (
            <Button 
              type="link" 
              icon={<EyeOutlined style={{ color: '#3498db' }} />} 
              onClick={onViewAll}
              size="small"
              style={{
                color: '#3498db',
                fontWeight: '600'
              }}
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
            description="No activities found"
            style={{ 
              margin: '60px 0',
              color: '#7f8c8d'
            }}
          />
        ) : (
          <>
            <List
              dataSource={currentActivities}
              renderItem={activity => (
                <List.Item
                  style={{ 
                    padding: '16px 0', 
                    borderBottom: '1px solid #e8e8e8',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    borderRadius: '8px',
                    margin: '4px 0'
                  }}
                  onClick={() => onActivityClick(activity)}
                  className="activity-item"
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '8px',
                        height: '40px',
                        backgroundColor: priorityColors[activity.priority] || '#3498db',
                        borderRadius: '4px',
                        marginRight: '12px'
                      }} />
                    }
                    title={
                      <Text 
                        style={{ 
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          lineHeight: '1.4',
                          display: 'block'
                        }}
                      >
                        {activity.title || 'Untitled Activity'}
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space size={8} wrap>
                          <Tag 
                            color={activity.type === 'meeting' ? '#3498db' : '#27ae60'}
                            style={{ 
                              fontSize: '11px', 
                              padding: '2px 6px',
                              margin: 0,
                              border: 'none',
                              fontWeight: '600'
                            }}
                          >
                            {activity.type === 'meeting' ? 'MEETING' : 'TASK'}
                          </Tag>
                          <Tag 
                            color={departments[activity.department]?.color || '#7f8c8d'}
                            style={{ 
                              fontSize: '11px', 
                              padding: '2px 6px',
                              margin: 0,
                              border: 'none',
                              fontWeight: '600'
                            }}
                          >
                            {activity.departmentName || activity.department}
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                          {new Date(activity.date || activity.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
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
                marginTop: '20px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid #e8e8e8'
              }}>
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  style={{
                    color: currentPage === 1 ? '#bdc3c7' : '#3498db',
                    fontWeight: '600'
                  }}
                >
                  Previous
                </Button>
                
                <Text style={{ 
                  color: '#7f8c8d',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Page {currentPage} of {totalPages}
                </Text>
                
                <Button
                  type="text"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  style={{
                    color: currentPage === totalPages ? '#bdc3c7' : '#3498db',
                    fontWeight: '600'
                  }}
                >
                  Next
                  <RightOutlined />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .activity-item:hover {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </Card>
  );
};

// Date Activities Modal Component
const DateActivitiesModal = ({ 
  visible, 
  onClose, 
  selectedDate, 
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
        <Tag 
          color={type === 'meeting' ? '#3498db' : '#27ae60'}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {type === 'meeting' ? 'Meeting' : 'Task'}
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
          onClick={() => onActivityClick(record)}
          style={{ 
            padding: 0, 
            height: 'auto', 
            textAlign: 'left', 
            fontSize: '14px',
            fontWeight: '600',
            color: '#2c3e50'
          }}
        >
          {title}
        </Button>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => (
        <Tag 
          color={departments[department]?.color || '#7f8c8d'}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {departments[department]?.name || department}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag 
          color={priorityColors[priority]}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {priorityLabels[priority]}
        </Tag>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: '#3498db' }} />
          <Text style={{ fontWeight: '600', color: '#2c3e50' }}>
            Activities for {selectedDate?.format('MMMM D, YYYY')}
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      style={{
        top: 20
      }}
      styles={{
        body: {
          padding: '20px 0'
        },
        header: {
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 24px'
        }
      }}
      footer={[
        <Button 
          key="close" 
          onClick={onClose} 
          size="large"
          style={{
            borderRadius: '8px',
            fontWeight: '600',
            padding: '8px 24px',
            height: 'auto'
          }}
        >
          Close
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
          <Col span={8}>
            <Card 
              size="small"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                border: 'none'
              }}
              bodyStyle={{ padding: '16px', textAlign: 'center' }}
            >
              <Statistic
                title="Total Activities"
                value={activities.length}
                valueStyle={{ color: '#fff', fontSize: '24px' }}
                titleStyle={{ color: 'rgba(255,255,255,0.9)' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              size="small"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                border: 'none'
              }}
              bodyStyle={{ padding: '16px', textAlign: 'center' }}
            >
              <Statistic
                title="Meetings"
                value={activities.filter(a => a.type === 'meeting').length}
                valueStyle={{ color: '#fff', fontSize: '24px' }}
                titleStyle={{ color: 'rgba(255,255,255,0.9)' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              size="small"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                border: 'none'
              }}
              bodyStyle={{ padding: '16px', textAlign: 'center' }}
            >
              <Statistic
                title="Tasks"
                value={activities.filter(a => a.type === 'task').length}
                valueStyle={{ color: '#fff', fontSize: '24px' }}
                titleStyle={{ color: 'rgba(255,255,255,0.9)' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={activities}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false,
            style: {
              borderRadius: '8px'
            }
          }}
          scroll={{ y: 400 }}
          size="middle"
          style={{
            borderRadius: '8px'
          }}
          locale={{
            emptyText: 'No activities scheduled for this date'
          }}
        />
      </Space>
    </Modal>
  );
};

// Department Filter Buttons
const DepartmentFilter = ({ selectedDepartment, onDepartmentChange }) => {
  return (
    <Card 
      size="small" 
      style={{ 
        marginBottom: 24,
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: 'none',
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      <Space wrap>
        <Text strong style={{ fontSize: '16px', color: '#2c3e50' }}>Filter by Department:</Text>
        {Object.entries(departments).map(([key, dept]) => (
          <Button
            key={key}
            type={selectedDepartment === key ? 'primary' : 'default'}
            size="large"
            style={{
              backgroundColor: selectedDepartment === key ? dept.color : '#ffffff',
              borderColor: dept.color,
              color: selectedDepartment === key ? '#fff' : dept.color,
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '8px 20px',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: selectedDepartment === key ? `0 4px 12px ${dept.color}40` : 'none',
              borderWidth: '2px'
            }}
            onClick={() => onDepartmentChange(key)}
          >
            {dept.name}
          </Button>
        ))}
        <Button
          type={!selectedDepartment ? 'primary' : 'default'}
          size="large"
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '8px 20px',
            height: 'auto',
            borderRadius: '8px',
            backgroundColor: !selectedDepartment ? '#3498db' : '#ffffff',
            borderColor: '#3498db',
            color: !selectedDepartment ? '#fff' : '#3498db',
            borderWidth: '2px'
          }}
          onClick={() => onDepartmentChange(null)}
        >
          All Departments
        </Button>
      </Space>
    </Card>
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
        <Tag 
          color={type === 'meeting' ? '#3498db' : '#27ae60'}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {type === 'meeting' ? 'Meeting' : 'Task'}
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
          onClick={() => onActivityClick(record)}
          style={{ 
            padding: 0, 
            height: 'auto', 
            textAlign: 'left',
            fontWeight: '600',
            color: '#2c3e50'
          }}
        >
          {title || 'Untitled Activity'}
        </Button>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => (
        <Tag 
          color={departments[department]?.color || '#7f8c8d'}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {departments[department]?.name || department}
        </Tag>
      )
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag 
          color={priorityColors[priority]}
          style={{ 
            border: 'none',
            fontWeight: '600',
            borderRadius: '6px'
          }}
        >
          {priorityLabels[priority]}
        </Tag>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date, record) => (
        <Text style={{ color: '#7f8c8d', fontWeight: '500' }}>
          {new Date(date || record.created_at).toLocaleDateString()}
        </Text>
      )
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined style={{ color: '#3498db' }} />
          <Text style={{ fontWeight: '600', color: '#2c3e50' }}>
            All Activities ({activities.length})
          </Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      style={{
        top: 20
      }}
      styles={{
        body: {
          padding: '20px 0'
        },
        header: {
          borderBottom: '1px solid #e8e8e8',
          padding: '16px 24px'
        }
      }}
      footer={[
        <Button 
          key="close" 
          onClick={onClose} 
          size="large"
          style={{
            borderRadius: '8px',
            fontWeight: '600',
            padding: '8px 24px',
            height: 'auto'
          }}
        >
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
          showQuickJumper: true,
          style: {
            borderRadius: '8px'
          }
        }}
        scroll={{ y: 600 }}
        size="middle"
        style={{
          borderRadius: '8px'
        }}
        locale={{
          emptyText: 'No activities found'
        }}
      />
    </Modal>
  );
};

// Loading component
const LoadingSpinner = ({ tip = "Loading dashboard data..." }) => (
  <div style={{ 
    textAlign: 'center', 
    padding: '100px 50px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
    borderRadius: '16px',
    margin: '20px'
  }}>
    <Spin size="large" tip={tip} />
  </div>
);

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{ 
    padding: '40px 20px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
    borderRadius: '16px',
    margin: '20px'
  }}>
    <Result
      status="error"
      title="Something went wrong"
      subTitle={error?.message || "An unexpected error occurred"}
      extra={
        <Button 
          type="primary" 
          onClick={resetErrorBoundary} 
          size="large"
          style={{
            borderRadius: '8px',
            fontWeight: '600',
            padding: '8px 24px',
            height: 'auto'
          }}
        >
          Try Again
        </Button>
      }
    />
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
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Stats state
  const [stats, setStats] = useState({
    totalMeetings: 0,
    totalTasks: 0,
    thisWeekMeetings: 0,
    highPriorityMeetings: 0,
    completedMeetings: 0,
    pendingTasks: 0
  });

  // Modal states - Using state to ensure modals always appear on top
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateActivitiesModalVisible, setDateActivitiesModalVisible] = useState(false);
  const [dateActivities, setDateActivities] = useState([]);
  const [allActivitiesModalVisible, setAllActivitiesModalVisible] = useState(false);

  // Auto-refresh states
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  // Calendar view state
  const [calendarView, setCalendarView] = useState('dayGridMonth');

  // Date range state
  const [dateRange, setDateRange] = useState(null);

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
    
    if (!context.includes('auto-refresh')) {
      toast.error(`Error in ${context}: ${errorMessage}`);
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

  // Enhanced modal handlers to ensure they always appear on top
  const showActivityModal = (activity) => {
    setSelectedActivity(activity);
    setIsActivityModalVisible(true);
  };

  const showDateActivitiesModal = (date, activities) => {
    setSelectedDate(date);
    setDateActivities(activities);
    setDateActivitiesModalVisible(true);
  };

  const showAllActivitiesModal = () => {
    setAllActivitiesModalVisible(true);
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
      toast.info('Dashboard data updated automatically');
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
      toast.success('Dashboard refreshed successfully');
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
        toast.info('Auto-refresh enabled (every 1 minute)');
      } else {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        toast.info('Auto-refresh disabled');
      }
    } catch (error) {
      handleError(error, 'toggle auto-refresh');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await fetchAllData();
    } catch (error) {
      handleError(error, 'fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get date field based on table
  const getDateFieldName = (tableName) => {
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
  };

  // Helper function to get activity title
  const getActivityTitle = (item) => {
    if (!item) return 'Unknown Activity';
    
    if (item.title) return item.title;
    if (item.meeting) return item.meeting;
    if (item.college_name) return `${item.college_name} Session`;
    if (item.customer_name) return `Visit: ${item.customer_name}`;
    if (item.principle_name) return `Principle: ${item.principle_name}`;
    if (item.promotional_activity) return item.promotional_activity;
    if (item.type) return item.type;
    return `${item.categoryName} Activity`;
  };

  const fetchAllData = async () => {
    const allMeetingsData = [];
    const allTasksData = [];

    try {
      const fetchPromises = Object.entries(tableCategoryMapping).map(async ([tableName, tableInfo]) => {
        try {
          let query = supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

          const { data, error } = await query;

          if (error) {
            console.warn(`Error fetching from ${tableName}:`, error);
            return;
          }

          if (data) {
            data.forEach(item => {
              try {
                const dateField = getDateFieldName(tableName);
                const itemWithMetadata = {
                  ...item,
                  sourceTable: tableName,
                  type: tableInfo.type,
                  categoryName: tableInfo.categoryName,
                  department: tableInfo.department,
                  departmentName: tableInfo.department,
                  date: item[dateField] || item.created_at,
                  title: getActivityTitle(item)
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

    } catch (error) {
      handleError(error, 'fetching all data');
      safeSetState(setAllMeetings, []);
      safeSetState(setAllTasks, []);
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
          const dateField = getDateFieldName(meeting.sourceTable);
          const meetingDate = new Date(meeting[dateField] || meeting.created_at);
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

  // Get filtered activities based on department
  const getFilteredActivities = () => {
    const allActivities = [...allMeetings, ...allTasks];
    
    if (!selectedDepartment) {
      return allActivities;
    }
    
    return allActivities.filter(activity => activity.department === selectedDepartment);
  };

  // Convert activities to FullCalendar events
  const getCalendarEvents = () => {
    const activities = getFilteredActivities();
    
    return activities.map(activity => {
      const dateField = getDateFieldName(activity.sourceTable);
      const startDate = activity[dateField] || activity.created_at;
      
      return {
        id: `${activity.sourceTable}-${activity.id}`,
        title: getActivityTitle(activity),
        start: startDate,
        extendedProps: {
          ...activity,
          priority: activity.priority || 1,
          type: activity.type,
          department: activity.department
        }
      };
    });
  };

  // Handle date click on calendar
  const handleDateClick = (date, arg) => {
    const activities = getFilteredActivities().filter(activity => {
      const dateField = getDateFieldName(activity.sourceTable);
      const activityDate = new Date(activity[dateField] || activity.created_at);
      return activityDate.toDateString() === date.toDateString();
    });

    showDateActivitiesModal(dayjs(date), activities);
  };

  // Handle event click on calendar
  const handleEventClick = (event) => {
    const activity = event.extendedProps;
    showActivityModal(activity);
  };

  // Handle activity click in list
  const handleActivityClick = (activity) => {
    showActivityModal(activity);
  };

  // Get activities for current view (organizational or department)
  const getActivitiesForView = () => {
    if (activeTab === 'organizational') {
      return getFilteredActivities();
    } else {
      // For department view, show only activities from user's department
      if (!currentUser) return [];
      const userDept = currentUser.department_id; // You might need to adjust this based on your user structure
      return getFilteredActivities().filter(activity => 
        activity.department_id === userDept || activity.department === departments[userDept]?.name
      );
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

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Clear date range filter
  const clearDateRange = () => {
    setDateRange(null);
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
    <div style={{ 
      padding: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      background: '#ACAC9B',
      backgroundImage: `
        linear-gradient(135deg, rgba(172, 172, 155, 0.9) 0%, rgba(172, 172, 155, 0.9) 100%),
        url('/images/image1.avif')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundBlendMode: 'overlay'
    }}>
      <ToastContainer 
        position="top-right" 
        autoClose={5000}
        style={{ zIndex: 9999 }}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Dashboard Error"
          description={`${error.context}: ${error.message}`}
          type="error"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          onClose={() => setError(null)}
          action={
            <Button size="large" type="primary" onClick={resetErrorBoundary}>
              Retry
            </Button>
          }
          style={{ 
            marginBottom: 24,
            borderRadius: '12px'
          }}
        />
      )}

      {/* Header with Controls */}
      <Card
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <IdcardOutlined style={{ color: '#3498db', fontSize: '28px' }} />
              <Title level={2} style={{ margin: 0, fontSize: '28px', color: '#2c3e50' }}>Dashboard</Title>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Text strong style={{ fontSize: '14px', color: '#2c3e50' }}>Date Range:</Text>
              <Space.Compact style={{ width: '100%' }}>
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  style={{ width: '100%' }}
                  size="large"
                />
                {dateRange && (
                  <Button 
                    onClick={clearDateRange}
                    size="large"
                    danger
                    style={{
                      borderRadius: '8px'
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Space.Compact>
            </Space>
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
                  style={{
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
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
          description="Dashboard data will automatically update every 1 minute."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          closable
          style={{ 
            marginBottom: 24,
            borderRadius: '12px'
          }}
        />
      )}

      {/* Statistics Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {[
          { key: 'totalMeetings', title: 'Total Meetings', icon: <CalendarOutlined />, color: '#3498db' },
          { key: 'totalTasks', title: 'Total Tasks', icon: <CheckCircleOutlined />, color: '#27ae60' },
          { key: 'thisWeekMeetings', title: 'This Week', icon: <TeamOutlined />, color: '#f39c12' },
          { key: 'highPriorityMeetings', title: 'High Priority', icon: <ExclamationCircleOutlined />, color: '#e74c3c' },
          { key: 'completedMeetings', title: 'Completed', icon: <CheckCircleOutlined />, color: '#27ae60' },
          { key: 'pendingTasks', title: 'Pending Tasks', icon: <ClockCircleOutlined />, color: '#faad14' }
        ].map((stat, index) => (
          <Col xs={12} sm={8} md={4} key={stat.key}>
            <Card 
              size="small" 
              style={{ 
                textAlign: 'center',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: 'none'
              }}
              bodyStyle={{ padding: '20px 12px' }}
            >
              <Statistic
                title={
                  <Text style={{ color: '#7f8c8d', fontSize: '12px', fontWeight: '600' }}>
                    {stat.title}
                  </Text>
                }
                value={stats[stat.key]}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                valueStyle={{ 
                  color: stat.color, 
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        style={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: 'none',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
          marginBottom: 24
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'organizational',
              label: (
                <Space>
                  <TeamOutlined />
                  Organizational View
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <DepartmentFilter
                    selectedDepartment={selectedDepartment}
                    onDepartmentChange={setSelectedDepartment}
                  />
                  
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                      <Card
                        title={
                          <Space>
                            <CalendarOutlined style={{ color: '#3498db' }} />
                            <Text style={{ color: '#2c3e50', fontWeight: '600', fontSize: '18px' }}>
                              Organizational Calendar - {selectedDepartment ? departments[selectedDepartment]?.name : 'All Departments'}
                            </Text>
                            {dateRange && (
                              <Tag 
                                color="#3498db" 
                                style={{ 
                                  marginLeft: '8px',
                                  border: 'none',
                                  fontWeight: '600',
                                  borderRadius: '6px'
                                }}
                              >
                                {dateRange[0].format('MMM D')} - {dateRange[1].format('MMM D, YYYY')}
                              </Tag>
                            )}
                          </Space>
                        }
                        bordered={false}
                        style={{
                          borderRadius: '16px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          border: 'none'
                        }}
                        extra={
                          <Button 
                            icon={<SyncOutlined />} 
                            onClick={manualRefresh}
                            loading={isRefreshing}
                            size="small"
                            style={{
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}
                          >
                            Refresh Calendar
                          </Button>
                        }
                      >
                        <EnhancedFullCalendar
                          events={getCalendarEvents()}
                          onDateClick={handleDateClick}
                          onEventClick={handleEventClick}
                          view={calendarView}
                          height="600px"
                          dateRange={dateRange}
                        />
                        
                        {/* Calendar Legend */}
                        <div style={{ 
                          marginTop: '24px', 
                          padding: '20px', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '12px',
                          border: '1px solid #e8e8e8'
                        }}>
                          <Text strong style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '12px', display: 'block' }}>
                            Calendar Legend (Activity Count):
                          </Text>
                          <Row gutter={16} style={{ marginTop: '12px' }}>
                            <Col xs={12} sm={6}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#27ae60',
                                  borderRadius: '6px',
                                  border: '2px solid #fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}></div>
                                <Text style={{ fontSize: '14px', fontWeight: '500' }}>1-3 Activities</Text>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#f39c12',
                                  borderRadius: '6px',
                                  border: '2px solid #fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}></div>
                                <Text style={{ fontSize: '14px', fontWeight: '500' }}>4-6 Activities</Text>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: '#e74c3c',
                                  borderRadius: '6px',
                                  border: '2px solid #fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}></div>
                                <Text style={{ fontSize: '14px', fontWeight: '500' }}>7+ Activities</Text>
                              </div>
                            </Col>
                            <Col xs={12} sm={6}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: 'transparent',
                                  borderRadius: '6px',
                                  border: '2px solid #d9d9d9'
                                }}></div>
                                <Text style={{ fontSize: '14px', fontWeight: '500' }}>No Activities</Text>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                      <RecentActivities
                        activities={getActivitiesForView()}
                        onActivityClick={handleActivityClick}
                        onViewAll={showAllActivitiesModal}
                      />
                    </Col>
                  </Row>
                </Space>
              )
            },
          ]}
        />
      </Card>

      {/* Date Activities Modal */}
      <DateActivitiesModal
        visible={dateActivitiesModalVisible}
        onClose={() => setDateActivitiesModalVisible(false)}
        selectedDate={selectedDate}
        activities={dateActivities}
        onActivityClick={handleActivityClick}
      />

      {/* All Activities Modal */}
      <AllActivitiesModal
        visible={allActivitiesModalVisible}
        onClose={() => setAllActivitiesModalVisible(false)}
        activities={getActivitiesForView()}
        onActivityClick={handleActivityClick}
      />

      {/* Activity Detail Modal */}
      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#3498db' }} />
            <Text style={{ fontWeight: '600', color: '#2c3e50' }}>Activity Details</Text>
          </Space>
        }
        open={isActivityModalVisible}
        onCancel={() => setIsActivityModalVisible(false)}
        footer={[
          <Button 
            key="close" 
            onClick={() => setIsActivityModalVisible(false)} 
            size="large"
            style={{
              borderRadius: '8px',
              fontWeight: '600',
              padding: '8px 24px',
              height: 'auto'
            }}
          >
            Close
          </Button>,
        ]}
        width={700}
        style={{
          top: 20
        }}
        styles={{
          body: {
            padding: '24px 0'
          },
          header: {
            borderBottom: '1px solid #e8e8e8',
            padding: '16px 24px'
          }
        }}
      >
        {selectedActivity ? (
          <div style={{ fontSize: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={3} style={{ margin: 0, color: '#3498db', fontSize: '24px' }}>
                  {getActivityTitle(selectedActivity)}
                </Title>
              </Col>
            </Row>
            
            <Divider style={{ margin: '20px 0' }} />
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Text strong>Type: </Text>
                <Tag 
                  color={selectedActivity.type === 'meeting' ? '#3498db' : '#27ae60'} 
                  style={{ 
                    fontSize: '14px',
                    border: 'none',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  {selectedActivity.type === 'meeting' ? 'Meeting' : 'Task'}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Department: </Text>
                <Tag 
                  color={departments[selectedActivity.department]?.color} 
                  style={{ 
                    fontSize: '14px',
                    border: 'none',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  {selectedActivity.departmentName || selectedActivity.department}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Category: </Text>
                <Text style={{ color: '#2c3e50', fontWeight: '500' }}>{selectedActivity.categoryName}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Priority: </Text>
                <Tag 
                  color={priorityColors[selectedActivity.priority]} 
                  style={{ 
                    fontSize: '14px',
                    border: 'none',
                    fontWeight: '600',
                    borderRadius: '6px'
                  }}
                >
                  {priorityLabels[selectedActivity.priority]}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text strong>Date: </Text>
                <Text style={{ color: '#2c3e50', fontWeight: '500' }}>
                  {new Date(
                    selectedActivity[getDateFieldName(selectedActivity.sourceTable)] || 
                    selectedActivity.created_at
                  ).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </Col>
              {selectedActivity.status && (
                <Col xs={24} sm={12}>
                  <Text strong>Status: </Text>
                  <Tag 
                    color={statusColors[selectedActivity.status]} 
                    style={{ 
                      fontSize: '14px',
                      border: 'none',
                      fontWeight: '600',
                      borderRadius: '6px'
                    }}
                  >
                    {selectedActivity.status}
                  </Tag>
                </Col>
              )}
            </Row>

            {selectedActivity.description && (
              <>
                <Divider style={{ margin: '20px 0' }} />
                <Row>
                  <Col span={24}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Description: </Text>
                    <Text style={{ 
                      display: 'block', 
                      marginTop: '8px',
                      color: '#2c3e50',
                      lineHeight: '1.6'
                    }}>
                      {selectedActivity.description}
                    </Text>
                  </Col>
                </Row>
              </>
            )}

            {selectedActivity.remarks && (
              <>
                <Divider style={{ margin: '20px 0' }} />
                <Row>
                  <Col span={24}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Remarks: </Text>
                    <Text style={{ 
                      display: 'block', 
                      marginTop: '8px',
                      color: '#2c3e50',
                      lineHeight: '1.6'
                    }}>
                      {selectedActivity.remarks}
                    </Text>
                  </Col>
                </Row>
              </>
            )}

            {selectedActivity.objectives && (
              <>
                <Divider style={{ margin: '20px 0' }} />
                <Row>
                  <Col span={24}>
                    <Text strong style={{ display: 'block', marginBottom: '8px' }}>Objectives: </Text>
                    <Text style={{ 
                      display: 'block', 
                      marginTop: '8px',
                      color: '#2c3e50',
                      lineHeight: '1.6'
                    }}>
                      {selectedActivity.objectives}
                    </Text>
                  </Col>
                </Row>
              </>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <FrownOutlined style={{ fontSize: '48px', color: '#bdc3c7', marginBottom: '16px' }} />
            <div style={{ fontSize: '16px', color: '#7f8c8d' }}>Activity details not available</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
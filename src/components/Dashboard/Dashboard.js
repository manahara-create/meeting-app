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
  Dropdown
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
  SURGE_SURGECARE: { name: 'Surge-Surgecare', color: '#2980b9' },
  SURGE_SURGECARE_IMAGE: { name: 'Surge-Surgecare-Image', color: '#8e44ad' }
};

// Complete table to category mapping
const tableCategoryMapping = {
  // BDM Department
  'bdm_college_session': { type: 'meeting', categoryName: 'BDM - College Session', department: 'BDM', shortName: 'College' },
  'bdm_weekly_meetings': { type: 'meeting', categoryName: 'BDM - Meeting Schedule', department: 'BDM', shortName: 'Meeting' },
  'bdm_principle_visit': { type: 'task', categoryName: 'BDM - Principle Visit', department: 'BDM', shortName: 'Principle' },
  'bdm_promotional_activities': { type: 'task', categoryName: 'BDM - Promotional Activities', department: 'BDM', shortName: 'Promo' },
  'bdm_customer_visit': { type: 'task', categoryName: 'BDM - Visit Plan', department: 'BDM', shortName: 'Visit' },
  
  // Cluster 1
  'cluster_1_meetings': { type: 'meeting', categoryName: 'Cluster 1 - Meetings', department: 'CLUSTER_1', shortName: 'C1 Meet' },
  'cluster_1_special_task': { type: 'task', categoryName: 'Cluster 1 - Special Tasks', department: 'CLUSTER_1', shortName: 'C1 Task' },
  'cluster_1_visit_plan': { type: 'task', categoryName: 'Cluster 1 - Visit Plan', department: 'CLUSTER_1', shortName: 'C1 Visit' },
  
  // Cluster 2
  'cluster_2_meetings': { type: 'meeting', categoryName: 'Cluster 2 - Meetings', department: 'CLUSTER_2', shortName: 'C2 Meet' },
  'cluster_2_special_task': { type: 'task', categoryName: 'Cluster 2 - Special Tasks', department: 'CLUSTER_2', shortName: 'C2 Task' },
  'cluster_2_visit_plan': { type: 'task', categoryName: 'Cluster 2 - Visit Plan', department: 'CLUSTER_2', shortName: 'C2 Visit' },
  
  // Cluster 3
  'cluster_3_meetings': { type: 'meeting', categoryName: 'Cluster 3 - Meetings', department: 'CLUSTER_3', shortName: 'C3 Meet' },
  'cluster_3_special_task': { type: 'task', categoryName: 'Cluster 3 - Special Tasks', department: 'CLUSTER_3', shortName: 'C3 Task' },
  'cluster_3_visit_plan': { type: 'task', categoryName: 'Cluster 3 - Visit Plan', department: 'CLUSTER_3', shortName: 'C3 Visit' },
  
  // Cluster 4
  'cluster_4_meetings': { type: 'meeting', categoryName: 'Cluster 4 - Meetings', department: 'CLUSTER_4', shortName: 'C4 Meet' },
  'cluster_4_special_task': { type: 'task', categoryName: 'Cluster 4 - Special Tasks', department: 'CLUSTER_4', shortName: 'C4 Task' },
  'cluster_4_visit_plan': { type: 'task', categoryName: 'Cluster 4 - Visit Plan', department: 'CLUSTER_4', shortName: 'C4 Visit' },
  
  // Cluster 5
  'cluster_5_meetings': { type: 'meeting', categoryName: 'Cluster 5 - Meetings', department: 'CLUSTER_5', shortName: 'C5 Meet' },
  'cluster_5_special_task': { type: 'task', categoryName: 'Cluster 5 - Special Tasks', department: 'CLUSTER_5', shortName: 'C5 Task' },
  'cluster_5_visit_plan': { type: 'task', categoryName: 'Cluster 5 - Visit Plan', department: 'CLUSTER_5', shortName: 'C5 Visit' },
  
  // Cluster 6
  'cluster_6_meetings': { type: 'meeting', categoryName: 'Cluster 6 - Meetings', department: 'CLUSTER_6', shortName: 'C6 Meet' },
  'cluster_6_special_task': { type: 'task', categoryName: 'Cluster 6 - Special Tasks', department: 'CLUSTER_6', shortName: 'C6 Task' },
  'cluster_6_visit_plan': { type: 'task', categoryName: 'Cluster 6 - Visit Plan', department: 'CLUSTER_6', shortName: 'C6 Visit' },
  
  // Customer Care
  'customer_care_meetings': { type: 'meeting', categoryName: 'Customer Care - Meetings', department: 'CUSTOMER_CARE', shortName: 'CC Meet' },
  'customer_care_special_tasks': { type: 'task', categoryName: 'Customer Care - Special Tasks', department: 'CUSTOMER_CARE', shortName: 'CC Task' },
  'customer_care_delivery_schedule': { type: 'task', categoryName: 'Customer Care - Delivery Schedule', department: 'CUSTOMER_CARE', shortName: 'CC Delivery' },
  
  // E-Healthcare
  'ehealthcare_meetings': { type: 'meeting', categoryName: 'E-Healthcare Meetings', department: 'E_HEALTHCARE', shortName: 'E-Health Meet' },
  'ehealthcare_visit_plan': { type: 'task', categoryName: 'E-Healthcare Visit Plan', department: 'E_HEALTHCARE', shortName: 'E-Health Visit' },
  
  // Hi-Tech
  'hitech_page_generation': { type: 'task', categoryName: 'Hi-Tech Page Generation', department: 'HI_TECH', shortName: 'Hi-Tech Page' },
  'hitech_technical_discussions': { type: 'meeting', categoryName: 'Hi-Tech Technical Discussion', department: 'HI_TECH', shortName: 'Hi-Tech Tech' },
  'hitech_tender_validation': { type: 'task', categoryName: 'Hi-Tech Tender Validation', department: 'HI_TECH', shortName: 'Hi-Tech Tender' },
  
  // HR
  'hr_meetings': { type: 'meeting', categoryName: 'HR - Meetings', department: 'HR', shortName: 'HR Meet' },
  'hr_special_events_n_tasks': { type: 'task', categoryName: 'HR - Special Events', department: 'HR', shortName: 'HR Event' },
  'hr_training': { type: 'task', categoryName: 'HR - Trainings', department: 'HR', shortName: 'HR Training' },
  
  // Imports
  'imports_meetings': { type: 'meeting', categoryName: 'Imports - Meeting Schedules', department: 'IMPORTS', shortName: 'Imports Meet' },
  'imports_upcoming_shipments': { type: 'task', categoryName: 'Imports - Upcoming Shipments', department: 'IMPORTS', shortName: 'Imports Ship' },
  
  // Regulatory
  'regulatory_meetings': { type: 'meeting', categoryName: 'Regulatory - Meetings', department: 'REGULATORY', shortName: 'Regulatory Meet' },
  'regulatory_submissions': { type: 'task', categoryName: 'Regulatory - Submissions', department: 'REGULATORY', shortName: 'Regulatory Sub' },
  
  // Sales Operations
  'sales_operations_meetings': { type: 'meeting', categoryName: 'Sales Operations Meetings', department: 'SALES_OPERATIONS', shortName: 'Sales Ops Meet' },
  'sales_operations_special_tasks': { type: 'task', categoryName: 'Sales Operations Special Tasks', department: 'SALES_OPERATIONS', shortName: 'Sales Ops Task' },
  
  // SOMT
  'somt_meetings': { type: 'meeting', categoryName: 'SOMT -Meetings', department: 'SOMT', shortName: 'SOMT Meet' },
  'somt_tender': { type: 'task', categoryName: 'SOMT -Tender', department: 'SOMT', shortName: 'SOMT Tender' },
  
  // Stores
  'stores_plan_loading': { type: 'task', categoryName: 'Stores - Plan Loading', department: 'STORES', shortName: 'Stores Load' },
  'stores_vst': { type: 'task', categoryName: 'Stores - VST', department: 'STORES', shortName: 'Stores VST' },
  
  // Surge-Surgecare
  'surge_surgecare_imagine_college_session': { type: 'meeting', categoryName: 'SSI - College Session', department: 'SURGE_SURGECARE_IMAGE', shortName: 'SSI College' },
  'surge_surgecare_imagine_principal_visit': { type: 'task', categoryName: 'SSI - Principle Visit', department: 'SURGE_SURGECARE_IMAGE', shortName: 'SSI Principle' },
  'surge_surgecare_imagine_promotional_activities': { type: 'task', categoryName: 'SSI - Promotional Activities', department: 'SURGE_SURGECARE_IMAGE', shortName: 'SSI Promo' },
  'surge_surgecare_imagine_visit_plan': { type: 'task', categoryName: 'SSI - Visit Plan', department: 'SURGE_SURGECARE_IMAGE', shortName: 'SSI Visit' },
  'surge_surgecare_principal_visit': { type: 'task', categoryName: 'SS - Principle Visit', department: 'SURGE_SURGECARE', shortName: 'SS Principle' }
};

// Simplified Calendar Component (Excel-like view) with Week and Day views
const SimplifiedCalendar = ({ 
  activities, 
  onDateClick, 
  selectedDate,
  currentMonth,
  onMonthChange,
  onEventClick,
  viewMode,
  onViewModeChange
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
      const activityDate = new Date(activity.start || activity.date || activity.created_at);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  // Group activities by category for a date
  const getGroupedActivities = (date) => {
    const dateActivities = getActivitiesForDate(date);
    const grouped = {};
    
    dateActivities.forEach(activity => {
      const category = activity.categoryName;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(activity);
    });
    
    return grouped;
  };

  // Render month view
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = currentMonth.startOf('month').day();
    const weeks = [];
    let currentWeek = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(<td key={`empty-${i}`} className="calendar-empty-cell"></td>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day);
      const dateActivities = getActivitiesForDate(date.toDate());
      const groupedActivities = getGroupedActivities(date.toDate());
      const isToday = date.isSame(dayjs(), 'day');
      const isSelected = selectedDate && date.isSame(selectedDate, 'day');
      
      const cellClassNames = [
        'calendar-cell',
        isToday ? 'calendar-cell-today' : '',
        isSelected ? 'calendar-cell-selected' : '',
        dateActivities.length > 0 ? 'calendar-cell-has-events' : ''
      ].filter(Boolean).join(' ');
      
      currentWeek.push(
        <td key={day} className={cellClassNames}>
          <div 
            className="calendar-date"
            onClick={() => onDateClick(date, dateActivities)}
            style={{ cursor: 'pointer', height: '100%' }}
          >
            <div className="calendar-date-number">{day}</div>
            <div className="calendar-events">
              {Object.entries(groupedActivities).slice(0, 3).map(([category, activities]) => (
                <Tooltip 
                  key={category} 
                  title={`${category} (${activities.length} activities)`}
                >
                  <div 
                    className="calendar-event-category"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activities.length === 1) {
                        onEventClick(activities[0]);
                      }
                    }}
                  >
                    <Tag 
                      color={departments[activities[0].department]?.color || 'blue'}
                      style={{ 
                        fontSize: '10px', 
                        padding: '1px 4px', 
                        margin: '1px',
                        lineHeight: '1.2',
                        height: 'auto',
                        cursor: activities.length === 1 ? 'pointer' : 'default'
                      }}
                    >
                      {tableCategoryMapping[activities[0].sourceTable]?.shortName || category.substring(0, 8)}
                    </Tag>
                    {activities.length > 1 && (
                      <span style={{ fontSize: '9px', marginLeft: '2px' }}>
                        +{activities.length - 1}
                      </span>
                    )}
                  </div>
                </Tooltip>
              ))}
              {Object.keys(groupedActivities).length > 3 && (
                <div className="calendar-more-events">
                  <Tag style={{ fontSize: '9px', padding: '0 3px' }}>
                    +{Object.keys(groupedActivities).length - 3} more
                  </Tag>
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
        currentWeek.push(<td key={`empty-end-${currentWeek.length}`} className="calendar-empty-cell"></td>);
      }
      weeks.push(<tr key={weeks.length}>{currentWeek}</tr>);
    }
    
    return weeks;
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = currentMonth.startOf('week');
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.add(i, 'day');
      const dateActivities = getActivitiesForDate(date.toDate());
      const isToday = date.isSame(dayjs(), 'day');
      const isSelected = selectedDate && date.isSame(selectedDate, 'day');
      
      const cellClassNames = [
        'calendar-cell',
        'calendar-cell-week',
        isToday ? 'calendar-cell-today' : '',
        isSelected ? 'calendar-cell-selected' : '',
        dateActivities.length > 0 ? 'calendar-cell-has-events' : ''
      ].filter(Boolean).join(' ');
      
      days.push(
        <td key={i} className={cellClassNames} style={{ width: '14.28%' }}>
          <div 
            className="calendar-date"
            onClick={() => onDateClick(date, dateActivities)}
            style={{ cursor: 'pointer', height: '100%' }}
          >
            <div className="calendar-date-header">
              <div className="calendar-week-day">{date.format('ddd')}</div>
              <div className="calendar-date-number">{date.date()}</div>
            </div>
            <div className="calendar-events-week">
              {dateActivities.slice(0, 10).map((activity, index) => (
                <Tooltip key={index} title={activity.title}>
                  <div 
                    className="calendar-event-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(activity);
                    }}
                  >
                    <Tag 
                      color={departments[activity.department]?.color || 'blue'}
                      style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        margin: '2px 0',
                        lineHeight: '1.3',
                        height: 'auto',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.title.substring(0, 20)}
                      {activity.title.length > 20 ? '...' : ''}
                    </Tag>
                  </div>
                </Tooltip>
              ))}
              {dateActivities.length > 10 && (
                <div className="calendar-more-events">
                  <Tag style={{ fontSize: '10px', padding: '1px 4px' }}>
                    +{dateActivities.length - 10} more
                  </Tag>
                </div>
              )}
            </div>
          </div>
        </td>
      );
    }
    
    return [<tr key="week">{days}</tr>];
  };

  // Render day view
  const renderDayView = () => {
    const date = selectedDate || currentMonth;
    const dateActivities = getActivitiesForDate(date.toDate());
    const isToday = date.isSame(dayjs(), 'day');
    
    const cellClassNames = [
      'calendar-cell',
      'calendar-cell-day',
      isToday ? 'calendar-cell-today' : '',
      'calendar-cell-selected'
    ].filter(Boolean).join(' ');
    
    return [
      <tr key="day">
        <td className={cellClassNames} style={{ height: '500px' }}>
          <div className="calendar-date-day">
            <div className="calendar-date-header-day">
              <div className="calendar-week-day">{date.format('dddd')}</div>
              <div className="calendar-date-number-large">{date.format('MMMM D, YYYY')}</div>
            </div>
            <div className="calendar-events-day">
              {dateActivities.length === 0 ? (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description="No activities for this day"
                  style={{ margin: '40px 0' }}
                />
              ) : (
                dateActivities.map((activity, index) => (
                  <div 
                    key={index}
                    className="calendar-event-item-day"
                    onClick={() => onEventClick(activity)}
                  >
                    <Card 
                      size="small" 
                      style={{ 
                        marginBottom: '8px',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${departments[activity.department]?.color || '#1890ff'}`
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text strong style={{ fontSize: '14px', flex: 1 }}>
                            {activity.title}
                          </Text>
                          <Tag color={departments[activity.department]?.color}>
                            {departments[activity.department]?.name}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {activity.categoryName}
                        </Text>
                        {activity.hasTime && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ClockCircleOutlined /> {new Date(activity.start).toLocaleTimeString()}
                          </Text>
                        )}
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <Tag color={activity.type === 'meeting' ? 'blue' : 'green'}>
                            {activity.type === 'meeting' ? 'Meeting' : 'Task'}
                          </Tag>
                          <Tag color={priorityColors[activity.priority]}>
                            {priorityLabels[activity.priority]}
                          </Tag>
                        </div>
                      </Space>
                    </Card>
                  </div>
                ))
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
        
        {/* Calendar Legend */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <Text strong>Legend: </Text>
          <Space wrap size={[8, 8]} style={{ marginTop: '8px' }}>
            {Object.entries(departments).slice(0, 6).map(([key, dept]) => (
              <Space key={key} size={4}>
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: dept.color,
                    borderRadius: '2px'
                  }}
                />
                <Text style={{ fontSize: '12px' }}>{dept.name}</Text>
              </Space>
            ))}
            {Object.entries(departments).length > 6 && (
              <Text style={{ fontSize: '12px' }}>+{Object.entries(departments).length - 6} more departments</Text>
            )}
          </Space>
        </div>
      </div>
      
      <style jsx>{`
        .calendar-cell {
          border: 1px solid #e8e8e8;
          vertical-align: top;
          height: 120px;
          padding: 4px;
          background-color: white;
          transition: all 0.2s;
        }
        
        .calendar-cell-week {
          height: 400px;
        }
        
        .calendar-cell-day {
          height: auto;
          min-height: 500px;
        }
        
        .calendar-cell:hover {
          background-color: #f5f5f5;
        }
        
        .calendar-cell-today {
          background-color: #e6f7ff;
          border: 2px solid #1890ff;
        }
        
        .calendar-cell-selected {
          background-color: #f6ffed;
          border: 2px solid #52c41a;
        }
        
        .calendar-cell-has-events {
          background-color: #fff7e6;
        }
        
        .calendar-empty-cell {
          border: 1px solid #f0f0f0;
          background-color: #fafafa;
        }
        
        .calendar-date-number {
          font-weight: bold;
          margin-bottom: 4px;
          text-align: center;
          font-size: 14px;
        }
        
        .calendar-date-number-large {
          font-weight: bold;
          font-size: 18px;
          color: #1890ff;
        }
        
        .calendar-date-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .calendar-date-header-day {
          text-align: center;
          margin-bottom: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
        }
        
        .calendar-week-day {
          font-size: 12px;
          color: #666;
          font-weight: normal;
        }
        
        .calendar-date-header-day .calendar-week-day {
          font-size: 16px;
          color: white;
          font-weight: bold;
        }
        
        .calendar-events {
          max-height: 80px;
          overflow-y: auto;
        }
        
        .calendar-events-week {
          max-height: 340px;
          overflow-y: auto;
        }
        
        .calendar-events-day {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .calendar-event-category {
          margin-bottom: 2px;
          display: flex;
          align-items: center;
        }
        
        .calendar-event-item {
          margin-bottom: 4px;
        }
        
        .calendar-event-item-day {
          margin-bottom: 8px;
        }
        
        .calendar-more-events {
          text-align: center;
          margin-top: 4px;
        }
      `}</style>
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
          <Text strong>Recent Activities</Text>
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
            description="No activities found"
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
                        {activity.title || 'Untitled Activity'}
                      </Text>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {departments[activity.department]?.name} • {activity.categoryName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {activity.hasTime ? 
                            new Date(activity.start).toLocaleString() : 
                            new Date(activity.date || activity.created_at).toLocaleDateString()
                          }
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
        'Title': activity.title || 'Untitled Activity',
        'Department': departments[activity.department]?.name || activity.department,
        'Category': activity.categoryName,
        'Type': activity.type === 'meeting' ? 'Meeting' : 'Task',
        'Date': new Date(activity.date || activity.start || activity.created_at).toLocaleDateString(),
        'Time': activity.hasTime ? new Date(activity.start).toLocaleTimeString() : 'All Day',
        'Priority': priorityLabels[activity.priority],
        'Status': activity.status || 'scheduled',
        'Remarks': activity.remarks || '',
        'Responsible Person': activity.responsible_bdm || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
      
      const departmentSuffix = selectedDepartment ? `_${selectedDepartment}` : '';
      const fileName = `calendar_export_${currentView}${departmentSuffix}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
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
      const departmentText = selectedDepartment ? ` | Department: ${departments[selectedDepartment]?.name}` : '';
      doc.text(`View: ${currentView}${departmentText} | Generated: ${dayjs().format('MMMM D, YYYY h:mm A')}`, 14, 22);
      
      // Prepare table data manually without autoTable
      const headers = ['Title', 'Department', 'Category', 'Type', 'Date', 'Priority'];
      const tableData = activities.map(activity => [
        activity.title?.substring(0, 25) || 'Untitled Activity',
        departments[activity.department]?.name || activity.department,
        activity.categoryName.substring(0, 20),
        activity.type === 'meeting' ? 'Meeting' : 'Task',
        new Date(activity.date || activity.start || activity.created_at).toLocaleDateString(),
        priorityLabels[activity.priority]
      ]);

      // Simple table implementation
      let yPosition = 35;
      const lineHeight = 7;
      const colWidths = [40, 25, 30, 20, 20, 20];
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

      const departmentSuffix = selectedDepartment ? `_${selectedDepartment}` : '';
      const fileName = `calendar_export_${currentView}${departmentSuffix}_${dayjs().format('YYYY-MM-DD')}.pdf`;
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
        <Tag color={type === 'meeting' ? 'blue' : 'green'}>
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
          style={{ padding: 0, height: 'auto', textAlign: 'left', fontSize: '14px' }}
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
        <Tag color={departments[department]?.color || 'default'}>
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
          Activities for {selectedDate?.format('MMMM D, YYYY')}
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
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Activities"
                value={activities.length}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Meetings"
                value={activities.filter(a => a.type === 'meeting').length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Tasks"
                value={activities.filter(a => a.type === 'task').length}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="High Priority"
                value={activities.filter(a => a.priority >= 4).length}
                valueStyle={{ color: '#e74c3c' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={activities}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: false 
          }}
          scroll={{ y: 400 }}
          size="middle"
          locale={{
            emptyText: 'No activities scheduled for this date'
          }}
        />
      </Space>
    </Modal>
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
        <Tag color={type === 'meeting' ? 'blue' : 'green'}>
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
          style={{ padding: 0, height: 'auto', textAlign: 'left' }}
        >
          {title || 'Untitled Activity'}
        </Button>
      )
    },
    {
      title: 'Date',
      dataIndex: 'start',
      key: 'time',
      width: 120,
      render: (start, record) => (
        <Text>
          {record.hasTime ? 
            new Date(start).toLocaleString() : 
            new Date(start).toLocaleDateString()
          }
        </Text>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department) => (
        <Tag color={departments[department]?.color || 'default'}>
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
          All Activities ({activities.length})
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
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
          emptyText: 'No activities found'
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
      title="Activity Details"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} size="large">
          Close
        </Button>
      ]}
      width={700}
    >
      <div style={{ fontSize: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {selectedActivity.title || selectedActivity.categoryName}
            </Title>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Type: </Text>
            <Tag color={selectedActivity.type === 'meeting' ? 'blue' : 'green'} style={{ fontSize: '14px' }}>
              {selectedActivity.type === 'meeting' ? 'Meeting' : 'Task'}
            </Tag>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Department: </Text>
            <Tag color={departments[selectedActivity.department]?.color} style={{ fontSize: '14px' }}>
              {departments[selectedActivity.department]?.name}
            </Tag>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Category: </Text>
            <Text>{selectedActivity.categoryName}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Priority: </Text>
            <Tag color={priorityColors[selectedActivity.priority]} style={{ fontSize: '14px' }}>
              {priorityLabels[selectedActivity.priority]}
            </Tag>
          </Col>
          <Col xs={24}>
            <Text strong>Date: </Text>
            <Text>{formatDate(selectedActivity.date || selectedActivity.start || selectedActivity.created_at)}</Text>
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

        {selectedActivity.remarks && (
          <>
            <Divider />
            <Row>
              <Col span={24}>
                <Text strong>Remarks: </Text>
                <Text style={{ display: 'block', marginTop: '8px' }}>
                  {selectedActivity.remarks}
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
  const [dateActivitiesModalVisible, setDateActivitiesModalVisible] = useState(false);
  const [dateActivities, setDateActivities] = useState([]);
  const [allActivitiesModalVisible, setAllActivitiesModalVisible] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalMeetings: 0,
    totalTasks: 0,
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

  // Helper function to get date field based on table
  const getDateFieldName = (tableName) => {
    const dateFields = {
      'bdm_customer_visit': 'schedule_date',
      'bdm_principle_visit': 'visit_duration_start',
      'bdm_weekly_meetings': 'date',
      'bdm_college_session': 'start_date',
      'bdm_promotional_activities': 'date',
      'sales_operations_meetings': 'date',
      'sales_operations_special_tasks': 'date',
      // Add other tables as needed...
    };
    return dateFields[tableName] || 'created_at';
  };

  // Helper function to get activity title
  const getActivityTitle = (item) => {
    if (!item) return 'Unknown Activity';
    
    if (item.meeting) return item.meeting;
    if (item.subject) return item.subject;
    if (item.customer_name) return `Visit: ${item.customer_name}`;
    if (item.principle_name) return `Principle: ${item.principle_name}`;
    if (item.promotional_activity) return item.promotional_activity;
    if (item.task) return item.task;
    
    return `${item.categoryName} Activity`;
  };

  const fetchAllActivities = async () => {
    const allActivitiesData = [];

    try {
      const fetchPromises = Object.entries(tableCategoryMapping).map(async ([tableName, tableInfo]) => {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.warn(`Error fetching from ${tableName}:`, error);
            return;
          }

          if (data) {
            data.forEach(item => {
              const dateField = getDateFieldName(tableName);
              const baseDate = item[dateField] || item.created_at;

              const itemWithMetadata = {
                ...item,
                sourceTable: tableName,
                type: tableInfo.type,
                categoryName: tableInfo.categoryName,
                department: tableInfo.department,
                date: baseDate,
                start: baseDate,
                title: getActivityTitle(item),
                priority: item.priority || 3, // Default priority
                status: item.status || 'scheduled'
              };

              allActivitiesData.push(itemWithMetadata);
            });
          }
        } catch (tableError) {
          console.warn(`Failed to fetch from table ${tableName}:`, tableError);
        }
      });

      await Promise.allSettled(fetchPromises);
      setAllActivities(allActivitiesData);
      calculateStats(allActivitiesData);
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
      const activityDate = new Date(activity.start || activity.date || activity.created_at);
      return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });

    const highPriorityActivities = activitiesData.filter(activity => activity.priority >= 4);
    const completedActivities = activitiesData.filter(activity => activity.status === 'completed');
    const pendingActivities = activitiesData.filter(activity => activity.status === 'pending');
    const meetings = activitiesData.filter(activity => activity.type === 'meeting');
    const tasks = activitiesData.filter(activity => activity.type === 'task');

    setStats({
      totalActivities: activitiesData.length,
      totalMeetings: meetings.length,
      totalTasks: tasks.length,
      thisWeekActivities: thisWeekActivities.length,
      highPriorityActivities: highPriorityActivities.length,
      completedActivities: completedActivities.length,
      pendingActivities: pendingActivities.length
    });
  };

  // Get filtered activities based on department
  const getFilteredActivities = () => {
    if (!selectedDepartment) {
      return allActivities;
    }
    
    return allActivities.filter(activity => activity.department === selectedDepartment);
  };

  const handleDateClick = (date, activities = []) => {
    setSelectedDate(date);
    
    if (activities.length > 0) {
      setDateActivities(activities);
      setDateActivitiesModalVisible(true);
    }
  };

  const handleEventClick = (activity) => {
    setSelectedActivity(activity);
    setIsActivityModalVisible(true);
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setIsActivityModalVisible(true);
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
                title="Total Activities"
                value={stats.totalActivities}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Meetings"
                value={stats.totalMeetings}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a', fontSize: '20px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title="Tasks"
                value={stats.totalTasks}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
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
                title="Pending"
                value={stats.pendingActivities}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14', fontSize: '20px' }}
              />
            </Card>
          </Col>
        </Row>

        <DepartmentFilter
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
        />

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
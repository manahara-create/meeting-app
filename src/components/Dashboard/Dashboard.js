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
  Collapse,
  Form,
  Input
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
  UnorderedListOutlined,
  PlusOutlined
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
const { TextArea } = Input;

// Organizational Legends Configuration
const organizationalLegends = {
  BMPL: { name: 'BMPL', color: '#3498db' },
  AIPL: { name: 'AIPL', color: '#e74c3c' },
  Cash: { name: 'Cash', color: '#2ecc71' },
  'End Month': { name: 'End Month', color: '#f39c12' },
  VST: { name: 'VST', color: '#9b59b6' },
  'Rolle-Over': { name: 'Rolle-Over', color: '#1abc9c' },
  'College Session': { name: 'College Session', color: '#34495e' },
  'Hi-Tech': { name: 'Hi-Tech', color: '#e67e22' },
  'Exco OP': { name: 'Exco OP', color: '#27ae60' },
  'Exco FIN': { name: 'Exco FIN', color: '#8e44ad' },
  'PRE EXCO SCMT': { name: 'PRE EXCO SCMT', color: '#d35400' },
  'PRE EXCO ASSD': { name: 'PRE EXCO ASSD', color: '#c0392b' },
  'PRE EXCO HR': { name: 'PRE EXCO HR', color: '#16a085' },
  'PRE EXCO SALES': { name: 'PRE EXCO SALES', color: '#2980b9' },
  'PRE EXCO IT': { name: 'PRE EXCO IT', color: '#f1c40f' },
  'Monthly Meeting BDM': { name: 'Monthly Meeting BDM', color: '#7f8c8d' },
  'Monthly Meeting EHPL': { name: 'Monthly Meeting EHPL', color: '#2c3e50' },
  'Monthly Meeting SCPL': { name: 'Monthly Meeting SCPL', color: '#e84393' }
};

// Function to calculate luminance and determine text color
const getTextColorBasedOnBackground = (backgroundColor) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Function to find matching legend from title
const findMatchingLegend = (title) => {
  if (!title) return null;

  const normalizedTitle = title.trim().toLowerCase();

  // Exact matches first
  for (const [key, legend] of Object.entries(organizationalLegends)) {
    if (normalizedTitle === legend.name.toLowerCase()) {
      return { key, legend };
    }
  }

  // Partial matches
  for (const [key, legend] of Object.entries(organizationalLegends)) {
    if (normalizedTitle.includes(legend.name.toLowerCase()) ||
      legend.name.toLowerCase().includes(normalizedTitle)) {
      return { key, legend };
    }
  }

  // Special case for variations
  const variations = {
    'monthly meeting bdm': 'Monthly Meeting BDM',
    'monthly meeting ehpl': 'Monthly Meeting EHPL',
    'monthly meeting scpl': 'Monthly Meeting SCPL',
    'monthly meeting scpl': 'Monthly Meeting SCPL',
    'rolle over': 'Rolle-Over',
    'rolle-over': 'Rolle-Over',
    'college': 'College Session',
    'exco': 'Exco OP',
    'pre exco': 'PRE EXCO SCMT',
    'end': 'End Month',
    'hi tech': 'Hi-Tech',
    'hi-tech': 'Hi-Tech'
  };

  for (const [variation, legendName] of Object.entries(variations)) {
    if (normalizedTitle.includes(variation)) {
      const legend = organizationalLegends[legendName];
      return { key: legendName, legend };
    }
  }

  return null;
};

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

// Complete table to category mapping matching database schema
const tableCategoryMapping = {
  // BDM Department
  'bdm_college_session': { type: 'meeting', categoryName: 'BDM - College Session', department: 'BDM', shortName: 'College' },
  'bdm_meetings': { type: 'meeting', categoryName: 'BDM - Meeting Schedule', department: 'BDM', shortName: 'Meeting' },
  'bdm_principle_visit': { type: 'task', categoryName: 'BDM - Principle Visit', department: 'BDM', shortName: 'Principle' },
  'bdm_promotional_activities': { type: 'task', categoryName: 'BDM - Promotional Activities', department: 'BDM', shortName: 'Promo' },
  'bdm_visit_plan': { type: 'task', categoryName: 'BDM - Visit Plan', department: 'BDM', shortName: 'Visit' },

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
  'hitech_technical_discussions': { type: 'meeting', categoryName: 'Hi-Tech Technical Discussion', department: 'HI_TECH', shortName: 'Hi-Tech Tech' },
  'hitech_tender_validation': { type: 'task', categoryName: 'Hi-Tech Tender Validation', department: 'HI_TECH', shortName: 'Hi-Tech Tender' },
  'hitech_visit_plan': { type: 'task', categoryName: 'Hi-Tech Visit Plan', department: 'HI_TECH', shortName: 'Hi-Tech Visit' },
  'hitech_page_generation': { type: 'task', categoryName: 'Hi-Tech Page Generation', department: 'HI_TECH', shortName: 'Hi-Tech Page' },

  // HR
  'hr_meetings': { type: 'meeting', categoryName: 'HR - Meetings', department: 'HR', shortName: 'HR Meet' },
  'hr_special_events_n_tasks': { type: 'task', categoryName: 'HR - Special Events', department: 'HR', shortName: 'HR Event' },
  'hr_training': { type: 'task', categoryName: 'HR - Trainings', department: 'HR', shortName: 'HR Training' },

  // Imports
  'imports_meetings': { type: 'meeting', categoryName: 'Imports - Meeting Schedules', department: 'IMPORTS', shortName: 'Imports Meet' },
  'imports_upcoming_shipment_clearance_plan': { type: 'task', categoryName: 'Imports - Upcoming Shipments', department: 'IMPORTS', shortName: 'Imports Ship' },

  // Regulatory
  'regulatory_meetings': { type: 'meeting', categoryName: 'Regulatory - Meetings', department: 'REGULATORY', shortName: 'Regulatory Meet' },
  'regulatory_submissions': { type: 'task', categoryName: 'Regulatory - Submissions', department: 'REGULATORY', shortName: 'Regulatory Sub' },

  // Sales Operations
  'sales_operations_meetings': { type: 'meeting', categoryName: 'Sales Operations Meetings', department: 'SALES_OPERATIONS', shortName: 'Sales Ops Meet' },
  'sales_operations_special_tasks': { type: 'task', categoryName: 'Sales Operations Special Tasks', department: 'SALES_OPERATIONS', shortName: 'Sales Ops Task' },

  // SOMT
  'somt_meetings': { type: 'meeting', categoryName: 'SOMT - Meetings', department: 'SOMT', shortName: 'SOMT Meet' },
  'somt_tender': { type: 'task', categoryName: 'SOMT - Tender', department: 'SOMT', shortName: 'SOMT Tender' },

  // Stores
  'stores_plan_loading': { type: 'task', categoryName: 'Stores - Plan Loading', department: 'STORES', shortName: 'Stores Load' },
  'stores_vst': { type: 'task', categoryName: 'Stores - VST', department: 'STORES', shortName: 'Stores VST' },

  // Surgi Imaging
  'surgi_imaging_college_session': { type: 'meeting', categoryName: 'Surgi Imaging - College Session', department: 'SURGI_IMAGING', shortName: 'SI College' },
  'surgi_imaging_meetings': { type: 'meeting', categoryName: 'Surgi Imaging - Meetings', department: 'SURGI_IMAGING', shortName: 'SI Meet' },
  'surgi_imaging_principal_visit': { type: 'task', categoryName: 'Surgi Imaging - Principle Visit', department: 'SURGI_IMAGING', shortName: 'SI Principle' },
  'surgi_imaging_promotional_activities': { type: 'task', categoryName: 'Surgi Imaging - Promotional Activities', department: 'SURGI_IMAGING', shortName: 'SI Promo' },
  'surgi_imaging_special_tasks': { type: 'task', categoryName: 'Surgi Imaging - Special Tasks', department: 'SURGI_IMAGING', shortName: 'SI Task' },
  'surgi_imaging_visit_plan': { type: 'task', categoryName: 'Surgi Imaging - Visit Plan', department: 'SURGI_IMAGING', shortName: 'SI Visit' },

  // Surgi Surgicare
  'surgi_surgicare_college_session': { type: 'meeting', categoryName: 'Surgi Surgicare - College Session', department: 'SURGI_SURGICARE', shortName: 'SS College' },
  'surgi_surgicare_meetings': { type: 'meeting', categoryName: 'Surgi Surgicare - Meetings', department: 'SURGI_SURGICARE', shortName: 'SS Meet' },
  'surgi_surgicare_principal_visit': { type: 'task', categoryName: 'Surgi Surgicare - Principle Visit', department: 'SURGI_SURGICARE', shortName: 'SS Principle' },
  'surgi_surgicare_promotional_activities': { type: 'task', categoryName: 'Surgi Surgicare - Promotional Activities', department: 'SURGI_SURGICARE', shortName: 'SS Promo' },
  'surgi_surgicare_special_task': { type: 'task', categoryName: 'Surgi Surgicare - Special Tasks', department: 'SURGI_SURGICARE', shortName: 'SS Task' },
  'surgi_surgicare_visit_plan': { type: 'task', categoryName: 'Surgi Surgicare - Visit Plan', department: 'SURGI_SURGICARE', shortName: 'SS Visit' },

  // Personal Meetings
  'personal_meetings': { type: 'meeting', categoryName: 'Personal Meetings', department: 'PERSONAL', shortName: 'Personal' }
};

// COMPLETE FIXED helper function to get date field based on table with proper mapping
const getDateFieldName = (tableName) => {
  const dateFields = {
    // BDM Department
    'bdm_college_session': 'start_date',
    'bdm_meetings': 'date',
    'bdm_principle_visit': 'visit_duration_start',
    'bdm_promotional_activities': 'date',
    'bdm_visit_plan': 'schedule_date',

    // Cluster 1
    'cluster_1_meetings': 'date',
    'cluster_1_special_task': 'date',
    'cluster_1_visit_plan': 'date',

    // Cluster 2
    'cluster_2_meetings': 'date',
    'cluster_2_special_task': 'date',
    'cluster_2_visit_plan': 'date',

    // Cluster 3
    'cluster_3_meetings': 'date',
    'cluster_3_special_task': 'date',
    'cluster_3_visit_plan': 'date',

    // Cluster 4
    'cluster_4_meetings': 'date',
    'cluster_4_special_task': 'date',
    'cluster_4_visit_plan': 'date',

    // Cluster 5
    'cluster_5_meetings': 'date',
    'cluster_5_special_task': 'date',
    'cluster_5_visit_plan': 'date',

    // Cluster 6
    'cluster_6_meetings': 'date',
    'cluster_6_special_task': 'date',
    'cluster_6_visit_plan': 'date',

    // Customer Care
    'customer_care_delivery_schedule': 'delivery_date',
    'customer_care_meetings': 'date',
    'customer_care_special_tasks': 'date',

    // E-Healthcare - FIXED
    'ehealthcare_meetings': 'date',
    'ehealthcare_visit_plan': 'date',

    // Hi-Tech - FIXED: Some use created_at, some use date
    'hitech_page_generation': 'created_at', // No date field, use created_at
    'hitech_technical_discussions': 'created_at', // No date field, use created_at
    'hitech_tender_validation': 'date',
    'hitech_visit_plan': 'date',

    // HR - FIXED: All use date field
    'hr_meetings': 'date',
    'hr_special_events_n_tasks': 'date',
    'hr_training': 'date',

    // Imports - FIXED
    'imports_meetings': 'date',
    'imports_upcoming_shipment_clearance_plan': 'eta', // Uses eta field

    // Regulatory - FIXED
    'regulatory_meetings': 'date',
    'regulatory_submissions': 'date',

    // Sales Operations - FIXED
    'sales_operations_meetings': 'date',
    'sales_operations_special_tasks': 'date',

    // SOMT - FIXED
    'somt_meetings': 'date',
    'somt_tender': 'close_date', // Uses close_date field

    // Stores - FIXED
    'stores_plan_loading': 'date',
    'stores_vst': 'date',

    // Surgi Imaging - FIXED
    'surgi_imaging_college_session': 'date',
    'surgi_imaging_meetings': 'date',
    'surgi_imaging_principal_visit': 'start_time', // Uses start_time timestamp
    'surgi_imaging_promotional_activities': 'date',
    'surgi_imaging_special_tasks': 'date',
    'surgi_imaging_visit_plan': 'schedule_date',

    // Surgi Surgicare - FIXED
    'surgi_surgicare_college_session': 'date',
    'surgi_surgicare_meetings': 'date',
    'surgi_surgicare_principal_visit': 'visit_duration_start', // Uses visit_duration_start
    'surgi_surgicare_promotional_activities': 'date',
    'surgi_surgicare_special_task': 'date',
    'surgi_surgicare_visit_plan': 'schedule_date',

    // Personal Meetings - FIXED
    'personal_meetings': 'start_date'
  };

  const field = dateFields[tableName];
  if (!field) {
    console.warn(`No date field mapping found for table: ${tableName}, defaulting to 'date'`);
    return 'date';
  }

  return field;
};

// Create Organizational Event Modal
// Create Organizational Event Modal with Legend Selection
const CreateOrganizationalEventModal = ({ visible, onClose, onEventCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizational_data')
        .insert([
          {
            title: values.legend_type,
            date: values.date.format('YYYY-MM-DD'),
          }
        ])
        .select();

      if (error) throw error;

      toast.success('Organizational event created successfully!');
      form.resetFields();
      onEventCreated();
      onClose();
    } catch (error) {
      console.error('Error creating organizational event:', error);
      toast.error('Failed to create organizational event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Organizational Event"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
      <Form.Item
          name="legend_type"
          label="Legend Type"
          rules={[{ required: true, message: 'Please select legend type' }]}
        >
          <Select placeholder="Select legend type">
            {Object.entries(organizationalLegends).map(([key, legend]) => (
              <Option key={key} value={key}>
                <Space>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: legend.color,
                      borderRadius: '2px'
                    }}
                  />
                  {legend.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="date"
          label="Event Date"
          rules={[{ required: true, message: 'Please select event date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        
        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Event
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Organizational Calendar Component
const OrganizationalCalendar = ({
  activities,
  onDateClick,
  selectedDate,
  currentMonth,
  onMonthChange,
  onEventClick,
  viewMode,
  onViewModeChange,
  onShowAllCategories,
  onCreateEvent
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
      fullActivity: activity
    }));
  };

  // Get color based on legend type from title
  // Get color based on legend type from title or stored legend_type
  const getActivityColor = (activity) => {
    // First check if there's a stored legend_type
    if (activity.legend_type && organizationalLegends[activity.legend_type]) {
      const legend = organizationalLegends[activity.legend_type];
      const textColor = getTextColorBasedOnBackground(legend.color);

      return {
        background: legend.color,
        text: textColor,
        border: legend.color,
        legendName: legend.name
      };
    }

    // Fall back to automatic detection from title
    const match = findMatchingLegend(activity.title);

    if (match) {
      const { legend } = match;
      const textColor = getTextColorBasedOnBackground(legend.color);

      return {
        background: legend.color,
        text: textColor,
        border: legend.color,
        legendName: legend.name
      };
    }

    // Default color if no match found
    return {
      background: '#e3f2fd',
      text: '#1565c0',
      border: '#90caf9',
      legendName: 'Event'
    };
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
                    title={`${activity.title} (${colors.legendName})`}
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderView = () => {
    return renderMonthView();
  };

  const getHeaderText = () => {
    return currentMonth.format('MMMM YYYY');
  };

  const navigateView = (direction) => {
    onMonthChange(currentMonth.add(direction, 'month'));
  };

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <Text strong>Organizational Calendar</Text>
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
            }}
            size="small"
          >
            Today
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onCreateEvent}
            size="small"
          >
            Create Event
          </Button>
        </Space>
      }
      bordered={false}
    >
      {/* Legends */}
      <div style={{ marginBottom: '16px', padding: '12px', background: '#fafafa', borderRadius: '6px' }}>
        <Text strong style={{ marginBottom: '8px', display: 'block' }}>Legends:</Text>
        <Space wrap size={[8, 8]}>
          {Object.entries(organizationalLegends).map(([key, legend]) => {
            const textColor = getTextColorBasedOnBackground(legend.color);
            return (
              <Space key={key} size={4}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: legend.color,
                    borderRadius: '2px'
                  }}
                />
                <Text style={{
                  fontSize: '12px',
                  color: textColor,
                  padding: '2px 6px',
                  backgroundColor: legend.color,
                  borderRadius: '3px',
                  fontWeight: '500'
                }}>
                  {legend.name}
                </Text>
              </Space>
            );
          })}
        </Space>
      </div>

      <div className="organizational-calendar">
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
                  {day.substring(0, 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderView()}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Enhanced Calendar Component - Shows Meeting/Task Titles (Department View)
const DepartmentCalendar = ({
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
      const activityDate = new Date(activity.start || activity.date || activity.created_at);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  // Get activity titles for a date
  const getActivityTitlesForDate = (date) => {
    const dateActivities = getActivitiesForDate(date);

    return dateActivities.map(activity => ({
      id: activity.id || `${activity.sourceTable}-${activity.title}`,
      title: activity.title || getDefaultTitle(activity),
      type: activity.type,
      department: activity.department,
      priority: activity.priority,
      fullActivity: activity
    }));
  };

  // Get default title if activity title is missing
  const getDefaultTitle = (activity) => {
    const category = activity.categoryName;

    // Extract meaningful title from category name
    if (category.includes(' - ')) {
      return category.split(' - ')[1] || category;
    }

    return category || 'Activity';
  };

  // Get color based on activity type and priority
  const getActivityColor = (activity) => {
    const { type, priority } = activity;

    // Color based on type and priority
    const colorSchemes = {
      meeting: {
        1: { background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', text: '#1565c0', border: '#90caf9' },
        2: { background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)', text: '#2e7d32', border: '#a5d6a7' },
        3: { background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', text: '#ef6c00', border: '#ffb74d' },
        4: { background: 'linear-gradient(135deg, #fbe9e7 0%, #ffccbc 100%)', text: '#d84315', border: '#ff8a65' },
        5: { background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)', text: '#c62828', border: '#ef5350' }
      },
      task: {
        1: { background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', text: '#7b1fa2', border: '#ce93d8' },
        2: { background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)', text: '#303f9f', border: '#9fa8da' },
        3: { background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)', text: '#00695c', border: '#80cbc4' },
        4: { background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)', text: '#ff8f00', border: '#ffd54f' },
        5: { background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', text: '#ad1457', border: '#f48fb1' }
      }
    };

    return colorSchemes[type]?.[priority] || colorSchemes.meeting[3];
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
                      Object.groupBy(dateActivities, activity => activity.title || getDefaultTitle(activity))
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
                    title={`${activity.title} (${activity.type === 'meeting' ? 'Meeting' : 'Task'})`}
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
                      <span>{activity.type === 'meeting' ? '📅' : '✅'}</span>
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
                      Object.groupBy(dateActivities, activity => activity.title || getDefaultTitle(activity))
                    );
                  }}
                >
                  +{activityTitles.length - 10} more activities
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
                    No activities scheduled
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
                            {activity.type === 'meeting' ? '📅 Meeting' : '✅ Task'}
                          </span>
                          <span>
                            Priority: {priorityLabels[activity.priority]}
                          </span>
                          <span>
                            {departments[activity.department]?.name}
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
          <Text strong>Department Calendar</Text>
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
      <div className="department-calendar">
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

// Organizational Activity Detail Modal Component
const OrganizationalActivityDetailModal = ({
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

  const match = findMatchingLegend(selectedActivity.title);
  const legend = match ? match.legend : null;
  const textColor = legend ? getTextColorBasedOnBackground(legend.color) : '#000000';

  return (
    <Modal
      title="Organizational Event Details"
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
              Organizational Event
            </Tag>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Legend: </Text>
            {legend && (
              <Space>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: legend.color,
                    borderRadius: '2px'
                  }}
                />
                <Text style={{
                  color: textColor,
                  padding: '2px 8px',
                  backgroundColor: legend.color,
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {legend.name}
                </Text>
              </Space>
            )}
          </Col>
          <Col xs={24}>
            <Text strong>Date: </Text>
            <Text>{formatDate(selectedActivity.date)}</Text>
          </Col>
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

// Helper function to get activity title
const getActivityTitle = (item, tableName, categoryName) => {
  if (!item) return 'Unknown Activity';

  const department = tableCategoryMapping[tableName]?.department;

  // Department-specific title mappings
  const titleMappings = {
    // BDM Department
    'BDM': {
      'Meeting Schedule': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit',
      'Principle Visit': item.principle_name || 'Principle Visit',
      'College Session': item.session || 'College Session',
      'Promotional Activities': item.promotional_activity || 'Promotional Activity'
    },
    // Clusters (1-6)
    'CLUSTER_1': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    'CLUSTER_2': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    'CLUSTER_3': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    'CLUSTER_4': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    'CLUSTER_5': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    'CLUSTER_6': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting',
      'Visit Plan': item.area || 'Visit'
    },
    // Customer Care
    'CUSTOMER_CARE': {
      'Delivery Schedule': item.area || 'Delivery',
      'Meetings': item.subject || 'Meeting',
      'Special Tasks': item.subject || 'Task'
    },
    // E-Healthcare
    'E_HEALTHCARE': {
      'Visit Plan': item.area || 'Visit',
      'Meetings': item.subject || 'Meeting'
    },
    // Hi-Tech
    'HI_TECH': {
      'Visit Plan': item.institute || 'Visit',
      'Technical Discussion': item.sp_name || 'Technical Discussion',
      'Tender Validation': item.sp_name || 'Tender Validation',
      'Page Generation': item.sp_name || 'Page Generation'
    },
    // HR
    'HR': {
      'Meetings': item.subject || 'Meeting',
      'Training': item.training_program || 'Training',
      'Special Events': item.task || 'Special Event'
    },
    // Imports
    'IMPORTS': {
      'Upcoming Shipments': item.company || item.pord_number || 'Shipment',
      'Meeting Schedules': item.subject || 'Meeting'
    },
    // Regulatory
    'REGULATORY': {
      'Meetings': item.subject || 'Meeting',
      'Submissions': item.company || item.product || 'Submission'
    },
    // Sales Operations
    'SALES_OPERATIONS': {
      'Special Tasks': item.task || 'Task',
      'Meetings': item.meeting || 'Meeting'
    },
    // SOMT
    'SOMT': {
      'Tender': item.customer || item.instrument || 'Tender',
      'Meetings': item.subject || 'Meeting'
    },
    // Stores
    'STORES': {
      'Plan Loading': item.cluster || item.area || 'Loading',
      'VST': item.cluster || item.area || 'VST'
    },
    // Surgi Imaging
    'SURGI_IMAGING': {
      'Promotional Activities': item.promotional_activity || 'Promotional Activity',
      'Principal Visit': item.principle_name || 'Principle Visit',
      'College Session': item.session || 'College Session',
      'Visit Plan': item.area || 'Visit',
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting'
    },
    // Surgi Surgicare
    'SURGI_SURGICARE': {
      'Promotional Activities': item.promotional_activity || 'Promotional Activity',
      'Principal Visit': item.principle_name || 'Principle Visit',
      'College Session': item.session || 'College Session',
      'Visit Plan': item.area || 'Visit',
      'Special Tasks': item.task || 'Task',
      'Meetings': item.subject || 'Meeting'
    },
    // Personal
    'PERSONAL': {
      'Personal Meetings': item.topic || 'Personal Meeting'
    }
  };

  // Try to get department-specific title
  if (department && titleMappings[department] && titleMappings[department][categoryName]) {
    const title = titleMappings[department][categoryName];
    return typeof title === 'function' ? title(item) : title;
  }

  // Fallback to generic field names
  if (item.meeting) return item.meeting;
  if (item.subject) return item.subject;
  if (item.task) return item.task;
  if (item.name) return item.name;
  if (item.topic) return item.topic;
  if (item.principle_name) return `Principle: ${item.principle_name}`;
  if (item.promotional_activity) return item.promotional_activity;
  if (item.area) return `Area: ${item.area}`;
  if (item.session) return `Session: ${item.session}`;
  if (item.sp_name) return item.sp_name;
  if (item.training_program) return item.training_program;
  if (item.company) return `Company: ${item.company}`;

  return `${categoryName} Activity`;
};

// Main Dashboard Component
const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState([]);
  const [organizationalActivities, setOrganizationalActivities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [activeTab, setActiveTab] = useState('organizational'); // 'organizational', 'department'

  // Modal states
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false);
  const [isOrganizationalActivityModalVisible, setIsOrganizationalActivityModalVisible] = useState(false);
  const [allActivitiesModalVisible, setAllActivitiesModalVisible] = useState(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);

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
      await Promise.all([
        fetchAllActivities(),
        fetchOrganizationalActivities()
      ]);
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

  const fetchOrganizationalActivities = async () => {
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
        hasTime: false
      }));

      setOrganizationalActivities(activitiesData);

    } catch (error) {
      console.error('Error fetching organizational activities:', error);
      throw error;
    }
  };

  const fetchAllActivities = async () => {
    const allActivitiesData = [];

    try {
      const fetchPromises = Object.entries(tableCategoryMapping).map(async ([tableName, tableInfo]) => {
        try {
          const dateField = getDateFieldName(tableName);

          console.log(`Fetching from ${tableName} using date field: ${dateField}`);

          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order(dateField, { ascending: false })
            .limit(100);

          if (error) {
            console.warn(`Error fetching from ${tableName}:`, error);
            return;
          }

          if (data && data.length > 0) {
            let validRecords = 0;
            let invalidRecords = 0;

            data.forEach(item => {
              // Get the actual date field value
              const baseDate = item[dateField];

              if (!baseDate) {
                console.warn(`No date found for ${tableName} record ${item.id} in field ${dateField}`);
                invalidRecords++;
                return;
              }

              const itemWithMetadata = {
                ...item,
                sourceTable: tableName,
                type: tableInfo.type,
                categoryName: tableInfo.categoryName,
                department: tableInfo.department,
                date: baseDate, // Use the actual date field
                start: baseDate, // Use the actual date field
                title: getActivityTitle(item, tableName, tableInfo.categoryName),
                priority: item.priority || 3,
                status: item.status || 'scheduled',
                hasTime: !!(item.start_time || item.end_time),
                // Store the actual date field used for debugging
                _dateField: dateField,
                _rawDate: baseDate
              };

              allActivitiesData.push(itemWithMetadata);
              validRecords++;
            });

            console.log(`Fetched from ${tableName}: ${validRecords} valid, ${invalidRecords} invalid dates`);

            if (validRecords > 0) {
              console.log(`First date in ${tableName}: ${data[0]?.[dateField]}`);
            }
          } else {
            console.log(`No data found in table: ${tableName}`);
          }
        } catch (tableError) {
          console.warn(`Failed to fetch from table ${tableName}:`, tableError);
        }
      });

      await Promise.allSettled(fetchPromises);

      // Sort activities by actual date (not created_at)
      const sortedActivities = allActivitiesData.sort((a, b) => {
        const dateA = new Date(a.date || a.start || a.created_at);
        const dateB = new Date(b.date || b.start || b.created_at);
        return dateB - dateA; // Descending order (newest first)
      });

      setAllActivities(sortedActivities);
      calculateStats(sortedActivities);
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
  };

  const handleEventClick = (activity) => {
    // Close any open modals first
    setCategoryOverviewModalVisible(false);
    setCategoryEventsModalVisible(false);
    setAllActivitiesModalVisible(false);

    if (activity.sourceTable === 'organizational_data') {
      setSelectedActivity(activity);
      setIsOrganizationalActivityModalVisible(true);
    } else {
      setSelectedActivity(activity);
      setIsActivityModalVisible(true);
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.sourceTable === 'organizational_data') {
      setSelectedActivity(activity);
      setIsOrganizationalActivityModalVisible(true);
    } else {
      setSelectedActivity(activity);
      setIsActivityModalVisible(true);
    }
  };

  const handleShowAllCategories = (date, groupedActivities) => {
    // Close any open modals first
    setCategoryEventsModalVisible(false);
    setIsActivityModalVisible(false);
    setIsOrganizationalActivityModalVisible(false);
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

  const handleCreateEvent = () => {
    setCreateEventModalVisible(true);
  };

  const handleEventCreated = () => {
    fetchOrganizationalActivities();
  };

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
            onClick={() => onEventClick(record)}
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

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'organizational',
              label: 'Organizational View',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <OrganizationalCalendar
                      activities={organizationalActivities}
                      onDateClick={handleDateClick}
                      selectedDate={selectedDate}
                      currentMonth={currentMonth}
                      onMonthChange={handleMonthChange}
                      onEventClick={handleEventClick}
                      viewMode={viewMode}
                      onViewModeChange={handleViewModeChange}
                      onShowAllCategories={handleShowAllCategories}
                      onCreateEvent={handleCreateEvent}
                    />
                  </Col>

                  <Col xs={24} lg={8}>
                    <RecentActivities
                      activities={organizationalActivities}
                      onActivityClick={handleActivityClick}
                      onViewAll={() => setAllActivitiesModalVisible(true)}
                    />
                  </Col>
                </Row>
              )
            },
            {
              key: 'department',
              label: 'Department View',
              children: (
                <>
                  <DepartmentFilter
                    selectedDepartment={selectedDepartment}
                    onDepartmentChange={setSelectedDepartment}
                  />
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                      <DepartmentCalendar
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
                </>
              )
            }
          ]}
        />

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

        {/* Organizational Activity Detail Modal */}
        <OrganizationalActivityDetailModal
          visible={isOrganizationalActivityModalVisible}
          onClose={() => setIsOrganizationalActivityModalVisible(false)}
          selectedActivity={selectedActivity}
        />

        {/* Create Organizational Event Modal */}
        <CreateOrganizationalEventModal
          visible={createEventModalVisible}
          onClose={() => setCreateEventModalVisible(false)}
          onEventCreated={handleEventCreated}
        />
      </div>
    </ConfigProvider>
  );
};

export default Dashboard;
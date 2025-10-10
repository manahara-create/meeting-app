import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  message,
  Tabs,
  Table,
  Modal,
  Space,
  Tag,
  DatePicker,
  Select,
  Typography,
  Avatar,
  Divider,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Extend dayjs with required plugins
try {
  dayjs.extend(isBetween);
  dayjs.extend(isSameOrBefore);
  dayjs.extend(isSameOrAfter);
} catch (error) {
  console.error('Error extending Day.js plugins:', error);
}

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  
  // Schedule states
  const [personalMeetings, setPersonalMeetings] = useState([]);
  const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingForm] = Form.useForm();
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  // Safe date parsing function
  const safeDayjs = (date) => {
    try {
      return dayjs.isDayjs(date) ? date : dayjs(date);
    } catch (error) {
      console.error('Error parsing date:', date, error);
      return dayjs(); // Return current date as fallback
    }
  };

  // Safe isBetween function with error handling
  const safeIsBetween = (date, start, end, unit = 'day', inclusivity = '[]') => {
    try {
      const targetDate = safeDayjs(date);
      const startDate = safeDayjs(start);
      const endDate = safeDayjs(end);
      
      // Check if isBetween function exists
      if (typeof targetDate.isBetween !== 'function') {
        console.warn('isBetween function not available, using fallback logic');
        // Fallback logic: check if date is between start and end
        return (targetDate.isSameOrAfter(startDate, unit) && 
                targetDate.isSameOrBefore(endDate, unit));
      }
      
      return targetDate.isBetween(startDate, endDate, unit, inclusivity);
    } catch (error) {
      console.error('Error in safeIsBetween:', error);
      return false;
    }
  };

  // Fetch current user profile
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user) {
        message.warning('No user found. Please log in.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          departments(name)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile not found, create one
          await createUserProfile(user);
          return;
        }
        throw profileError;
      }
      
      if (profile) {
        setCurrentUser({
          ...user,
          ...profile,
          department_name: profile.departments?.name
        });
        
        // Set form values
        form.setFieldsValue({
          email: profile.email || user.email,
          full_name: profile.full_name,
          department_id: profile.department_id,
          role: profile.role
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      message.error(`Failed to load profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create user profile if not exists
  const createUserProfile = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      
      message.success('Profile created successfully');
      fetchCurrentUser(); // Retry fetching
    } catch (error) {
      console.error('Error creating profile:', error);
      message.error('Failed to create user profile');
    }
  };

  // Fetch personal meetings
  const fetchPersonalMeetings = async () => {
    try {
      setMeetingsLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        message.warning('Please log in to view meetings');
        return;
      }

      const { data, error } = await supabase
        .from('personal_meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonalMeetings(data || []);
    } catch (error) {
      console.error('Error fetching personal meetings:', error);
      message.error(`Failed to load personal meetings: ${error.message}`);
    } finally {
      setMeetingsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchPersonalMeetings();
  }, []);

  // Update profile
  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const updateData = {
        full_name: values.full_name?.trim(),
        department_id: values.department_id,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      message.success('Profile updated successfully');
      setEditing(false);
      fetchCurrentUser(); // Refresh user data
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(`Failed to update profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Schedule CRUD operations
  const handleCreateMeeting = async (values) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      if (!values.dateRange || values.dateRange.length !== 2) {
        throw new Error('Invalid date range selected');
      }

      const meetingData = {
        topic: values.topic?.trim(),
        description: values.description?.trim(),
        venue: values.venue?.trim(),
        user_id: user.id,
        start_date: safeDayjs(values.dateRange[0]).format('YYYY-MM-DD'),
        end_date: safeDayjs(values.dateRange[1]).format('YYYY-MM-DD'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Validate dates
      if (safeDayjs(meetingData.start_date).isAfter(meetingData.end_date)) {
        throw new Error('Start date cannot be after end date');
      }

      const { error } = await supabase
        .from('personal_meetings')
        .insert([meetingData]);

      if (error) throw error;

      message.success('Meeting created successfully');
      setIsMeetingModalVisible(false);
      meetingForm.resetFields();
      fetchPersonalMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      message.error(`Failed to create meeting: ${error.message}`);
    }
  };

  const handleUpdateMeeting = async (values) => {
    try {
      if (!values.dateRange || values.dateRange.length !== 2) {
        throw new Error('Invalid date range selected');
      }

      const meetingData = {
        topic: values.topic?.trim(),
        description: values.description?.trim(),
        venue: values.venue?.trim(),
        start_date: safeDayjs(values.dateRange[0]).format('YYYY-MM-DD'),
        end_date: safeDayjs(values.dateRange[1]).format('YYYY-MM-DD'),
        updated_at: new Date().toISOString()
      };

      // Validate dates
      if (safeDayjs(meetingData.start_date).isAfter(meetingData.end_date)) {
        throw new Error('Start date cannot be after end date');
      }

      const { error } = await supabase
        .from('personal_meetings')
        .update(meetingData)
        .eq('id', editingMeeting.id);

      if (error) throw error;

      message.success('Meeting updated successfully');
      setIsMeetingModalVisible(false);
      setEditingMeeting(null);
      meetingForm.resetFields();
      fetchPersonalMeetings();
    } catch (error) {
      console.error('Error updating meeting:', error);
      message.error(`Failed to update meeting: ${error.message}`);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      if (!id) throw new Error('No meeting ID provided');

      const { error } = await supabase
        .from('personal_meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Meeting deleted successfully');
      fetchPersonalMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      message.error(`Failed to delete meeting: ${error.message}`);
    }
  };

  const openMeetingModal = (meeting = null) => {
    try {
      setEditingMeeting(meeting);
      if (meeting) {
        meetingForm.setFieldsValue({
          ...meeting,
          dateRange: [
            safeDayjs(meeting.start_date),
            safeDayjs(meeting.end_date)
          ]
        });
      } else {
        meetingForm.resetFields();
      }
      setIsMeetingModalVisible(true);
    } catch (error) {
      console.error('Error opening meeting modal:', error);
      message.error('Failed to open meeting form');
    }
  };

  const closeMeetingModal = () => {
    setIsMeetingModalVisible(false);
    setEditingMeeting(null);
    meetingForm.resetFields();
  };

  // Get status tag color based on dates
  const getMeetingStatus = (meeting) => {
    try {
      if (!meeting?.start_date || !meeting?.end_date) {
        return <Tag color="default">Unknown</Tag>;
      }

      const today = safeDayjs();
      const startDate = safeDayjs(meeting.start_date);
      const endDate = safeDayjs(meeting.end_date);

      if (today.isBefore(startDate)) {
        return <Tag color="blue">Upcoming</Tag>;
      } else if (today.isAfter(endDate)) {
        return <Tag color="green">Completed</Tag>;
      } else {
        return <Tag color="orange">Ongoing</Tag>;
      }
    } catch (error) {
      console.error('Error getting meeting status:', error);
      return <Tag color="default">Error</Tag>;
    }
  };

  // Table columns for personal meetings
  const meetingColumns = [
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
      render: (text) => text || 'No Topic'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <Text ellipsis={{ tooltip: text }}>
          {text || 'No Description'}
        </Text>
      )
    },
    {
      title: 'Date Range',
      key: 'date_range',
      render: (record) => {
        try {
          return (
            <Space>
              <Tag color="blue">
                {safeDayjs(record.start_date).format('MMM D, YYYY')}
              </Tag>
              <Text>to</Text>
              <Tag color="blue">
                {safeDayjs(record.end_date).format('MMM D, YYYY')}
              </Tag>
            </Space>
          );
        } catch (error) {
          console.error('Error rendering date range:', error);
          return <Text type="secondary">Invalid dates</Text>;
        }
      }
    },
    {
      title: 'Venue',
      dataIndex: 'venue',
      key: 'venue',
      render: (text) => text || 'Not specified'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getMeetingStatus(record)
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => {
        try {
          return safeDayjs(date).format('MMM D, YYYY HH:mm');
        } catch (error) {
          return 'Invalid date';
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openMeetingModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this meeting?"
            onConfirm={() => handleDeleteMeeting(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Calculate meeting statistics safely
  const getMeetingStats = () => {
    try {
      const today = safeDayjs();
      
      const upcoming = personalMeetings.filter(m => 
        m.start_date && today.isBefore(safeDayjs(m.start_date))
      ).length;
      
      const ongoing = personalMeetings.filter(m => 
        m.start_date && m.end_date && 
        safeIsBetween(today, m.start_date, m.end_date)
      ).length;
      
      const completed = personalMeetings.filter(m => 
        m.end_date && today.isAfter(safeDayjs(m.end_date))
      ).length;

      return { upcoming, ongoing, completed };
    } catch (error) {
      console.error('Error calculating meeting stats:', error);
      return { upcoming: 0, ongoing: 0, completed: 0 };
    }
  };

  const { upcoming, ongoing, completed } = getMeetingStats();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Profile & Schedule</Title>
      
      <Tabs defaultActiveKey="profile">
        {/* Profile Tab */}
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              Profile
            </span>
          } 
          key="profile"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card loading={loading}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Avatar
                    size={100}
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: '#1890ff',
                      marginBottom: 16
                    }}
                  />
                  <Title level={3}>{currentUser?.full_name || 'No Name'}</Title>
                  <Text type="secondary">{currentUser?.email}</Text>
                  <Divider />
                  <Space direction="vertical" size="small">
                    <div>
                      <Text strong>Role: </Text>
                      <Tag color="blue">{currentUser?.role || 'user'}</Tag>
                    </div>
                    <div>
                      <Text strong>Department: </Text>
                      <Text>{currentUser?.department_name || 'Not assigned'}</Text>
                    </div>
                    <div>
                      <Text strong>Member Since: </Text>
                      <Text>
                        {currentUser?.created_at ? 
                          safeDayjs(currentUser.created_at).format('MMM D, YYYY') : 
                          'N/A'
                        }
                      </Text>
                    </div>
                  </Space>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card
                title="Profile Information"
                loading={loading}
                extra={
                  !editing ? (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Space>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => {
                          setEditing(false);
                          form.resetFields();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={loading}
                        onClick={() => form.submit()}
                      >
                        Save Changes
                      </Button>
                    </Space>
                  )
                }
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  disabled={!editing}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Full Name"
                        name="full_name"
                        rules={[
                          { required: true, message: 'Please enter your full name' },
                          { min: 2, message: 'Name must be at least 2 characters' }
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="Enter your full name" 
                          maxLength={100}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                      >
                        <Input disabled placeholder="Email" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Role"
                        name="role"
                      >
                        <Input disabled placeholder="Role" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Department"
                        name="department_id"
                      >
                        <Select placeholder="Select department" disabled>
                          <Option value={currentUser?.department_id}>
                            {currentUser?.department_name || 'Loading...'}
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {editing && (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '6px',
                      marginTop: '16px'
                    }}>
                      <Text type="secondary">
                        <strong>Note:</strong> You cannot change your role or email. 
                        Contact administrator for role changes.
                      </Text>
                    </div>
                  )}
                </Form>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Schedule Tab */}
        <TabPane 
          tab={
            <span>
              <CalendarOutlined />
              Personal Schedule
            </span>
          } 
          key="schedule"
        >
          <Card
            title="Personal Meetings & Schedule"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openMeetingModal()}
                loading={meetingsLoading}
              >
                Add Meeting
              </Button>
            }
          >
            <Table
              columns={meetingColumns}
              dataSource={personalMeetings}
              rowKey="id"
              loading={meetingsLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} meetings`
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ margin: 0 }}>
                    <p><strong>Description:</strong> {record.description || 'No description provided'}</p>
                    <p><strong>Venue:</strong> {record.venue || 'Not specified'}</p>
                    <p><strong>Status:</strong> {getMeetingStatus(record)}</p>
                    <p><strong>Duration:</strong> {safeDayjs(record.start_date).format('MMM D, YYYY')} to {safeDayjs(record.end_date).format('MMM D, YYYY')}</p>
                  </div>
                ),
                rowExpandable: (record) => true,
              }}
            />
          </Card>

          {/* Quick Stats */}
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total Meetings"
                  value={personalMeetings.length}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Upcoming"
                  value={upcoming}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Ongoing"
                  value={ongoing}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Meeting Modal */}
      <Modal
        title={editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
        open={isMeetingModalVisible}
        onCancel={closeMeetingModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={meetingForm}
          layout="vertical"
          onFinish={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
        >
          <Form.Item
            label="Meeting Topic"
            name="topic"
            rules={[
              { required: true, message: 'Please enter meeting topic' },
              { min: 3, message: 'Topic must be at least 3 characters' }
            ]}
          >
            <Input 
              placeholder="Enter meeting topic" 
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 1000, message: 'Description cannot exceed 1000 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter meeting description"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Date Range"
            name="dateRange"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Venue"
            name="venue"
            rules={[
              { max: 200, message: 'Venue cannot exceed 200 characters' }
            ]}
          >
            <Input 
              placeholder="Enter meeting venue" 
              maxLength={200}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeMeetingModal}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingMeeting ? 'Update Meeting' : 'Create Meeting'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Statistic component
const Statistic = ({ title, value, prefix, valueStyle }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
      {title}
    </div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', ...valueStyle }}>
      {prefix && <span style={{ marginRight: '8px' }}>{prefix}</span>}
      {value}
    </div>
  </div>
);

export default Profile;
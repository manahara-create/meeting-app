// NotificationPanel.jsx
import React, { useState, useEffect } from 'react'
import { BellOutlined, CloseOutlined, CheckCircleOutlined, DatabaseOutlined, MessageOutlined } from '@ant-design/icons'
import { Badge, Button, List, Popover, Tabs, Tag, Empty } from 'antd'
import { get, markRead, markAllRead, remove, onChange, getRecentDatabaseChanges, DB_OPERATIONS } from './store'

const { TabPane } = Tabs

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const unsubscribe = onChange((newNotifications, count) => {
      setNotifications(newNotifications)
      setUnreadCount(count)
    })

    return unsubscribe
  }, [])

  const handleMarkAsRead = (id) => {
    markRead(id)
  }

  const handleMarkAllAsRead = () => {
    markAllRead()
  }

  const handleRemove = (id, e) => {
    e.stopPropagation()
    remove(id)
  }

  const getOperationColor = (operation) => {
    const colors = {
      'create': 'green',
      'update': 'blue',
      'delete': 'red',
      'discussion': 'purple'
    };
    return colors[operation] || 'default';
  };

  const getNotificationIcon = (notification) => {
    if (notification.source === 'database') {
      return <DatabaseOutlined style={{ color: '#1890ff' }} />
    }

    const icons = {
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      error: <CloseOutlined style={{ color: '#ff4d4f' }} />,
      warning: <CloseOutlined style={{ color: '#faad14' }} />,
      info: <MessageOutlined style={{ color: '#1890ff' }} />
    }

    return icons[notification.type] || <MessageOutlined />
  }

  const renderNotificationItem = (notification) => (
    <List.Item
      key={notification.id}
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      onClick={() => handleMarkAsRead(notification.id)}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: notification.read ? '#fff' : '#f6ffed'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            {getNotificationIcon(notification)}
            <span style={{ marginLeft: 8, fontWeight: notification.read ? 'normal' : '600' }}>
              {notification.topic}
            </span>
          </div>

          {/* New fields display */}
          <div style={{ margin: '4px 0' }}>
            {notification.department_name && (
              <Tag color="blue" size="small" style={{ marginRight: 4 }}>
                {notification.department_name}
              </Tag>
            )}
            {notification.category_name && (
              <Tag color="green" size="small" style={{ marginRight: 4 }}>
                {notification.category_name}
              </Tag>
            )}
            {notification.operation_type && (
              <Tag color={getOperationColor(notification.operation_type)} size="small">
                {notification.operation_type.toUpperCase()}
              </Tag>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <small style={{ color: '#999' }}>
              {new Date(notification.created_at).toLocaleString()}
            </small>

            {notification.table_name && (
              <Tag size="small" style={{ marginLeft: 4 }}>
                Table: {notification.table_name}
              </Tag>
            )}
          </div>
        </div>

        <Button
          type="text"
          icon={<CloseOutlined />}
          size="small"
          onClick={(e) => handleRemove(notification.id, e)}
          style={{ marginLeft: 8 }}
        />
      </div>
    </List.Item>
  );

  const databaseChanges = notifications.filter(n => n.source === 'database')
  const systemNotifications = notifications.filter(n => n.source === 'system')

  const content = (
    <div style={{ width: 400 }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <strong>Notifications</strong>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultActiveKey="all" size="small">
        <TabPane tab={`All (${notifications.length})`} key="all">
          <List
            dataSource={notifications}
            renderItem={renderNotificationItem}
            locale={{ emptyText: <Empty description="No notifications" /> }}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </TabPane>

        <TabPane tab={`Database (${databaseChanges.length})`} key="database">
          <List
            dataSource={databaseChanges}
            renderItem={renderNotificationItem}
            locale={{ emptyText: <Empty description="No database changes" /> }}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </TabPane>

        <TabPane tab={`System (${systemNotifications.length})`} key="system">
          <List
            dataSource={systemNotifications}
            renderItem={renderNotificationItem}
            locale={{ emptyText: <Empty description="No system notifications" /> }}
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </TabPane>
      </Tabs>
    </div>
  )

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottomRight"
      overlayStyle={{ width: 400 }}
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: '16px' }}
        />
      </Badge>
    </Popover>
  )
}

export default NotificationPanel
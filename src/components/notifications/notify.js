// src/components/notifications/notify.js
import { notification } from 'antd'
import { add, addDatabaseChange } from './store'

function open(type, opts = {}) {
  const { title, description, key, duration, placement, log = true, meta } = opts
  const api = type in notification ? notification[type] : notification.open
  api({ 
    message: title, 
    description, 
    key, 
    duration: duration ?? 3, 
    placement: placement ?? 'topRight' 
  })
  if (log) add({ type, title, description, meta })
}

async function promise(promiseLike, { loading = 'Working...', success = 'Done', error = 'Failed', meta } = {}) {
  const key = 'p-' + Date.now()
  notification.open({ message: loading, key, duration: 0, placement: 'topRight' })
  try {
    const result = await promiseLike
    notification.success({ message: success, key, placement: 'topRight' })
    add({ type: 'success', title: success, meta })
    return result
  } catch (e) {
    const desc = e?.message || String(e)
    notification.error({ message: error, description: desc, key, placement: 'topRight' })
    add({ type: 'error', title: error, description: desc, meta })
    throw e
  }
}

// Helper function to get table display name
function getTableDisplayName(tableName) {
  const displayNames = {
    'bdm_college_session': 'College Session',
    'bdm_customer_visit': 'Customer Visit',
    'bdm_principle_visit': 'Principle Visit',
    'bdm_promotional_activities': 'Promotional Activity',
    'bdm_weekly_meetings': 'Weekly Meeting',
    'sales_operations_meetings': 'Sales Meeting',
    'sales_operations_tasks': 'Sales Task',
    'scmt_d_n_d': 'D&D Activity',
    'scmt_meetings_and_sessions': 'SCMT Meeting',
    'scmt_others': 'Other Activity',
    'scmt_weekly_meetings': 'SCMT Weekly Meeting',
    'meeting_requests': 'Meeting Request',
    'messages': 'Message'
  }
  
  return displayNames[tableName] || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Helper function to generate database change title
function generateDatabaseChangeTitle(change) {
  const { table, operation } = change
  const tableDisplay = getTableDisplayName(table)
  
  const operationTitles = {
    'insert': `New ${tableDisplay}`,
    'update': `${tableDisplay} Updated`,
    'delete': `${tableDisplay} Deleted`,
    'feedback': `New Feedback`
  }
  
  return operationTitles[operation] || 'Database Change'
}

// Helper function to generate database change description
function generateDatabaseChangeDescription(change) {
  const { table, operation, record } = change
  
  if (operation === 'feedback' && record.content) {
    return record.content.substring(0, 60) + (record.content.length > 60 ? '...' : '')
  }
  
  if (record.company) return record.company
  if (record.customer_name) return record.customer_name
  if (record.meeting) return record.meeting
  
  return 'Change detected in database'
}

// Database change notification
function databaseChange(change) {
  const { table, operation, record, oldRecord } = change
  
  // Determine notification type based on operation
  let notificationType = 'info'
  if (operation === 'insert') notificationType = 'success'
  if (operation === 'delete') notificationType = 'warning'
  if (operation === 'feedback') notificationType = 'info'
  
  const title = generateDatabaseChangeTitle(change)
  const description = generateDatabaseChangeDescription(change)
  
  // Show toast notification
  notification[notificationType]({
    message: title,
    description,
    placement: 'topRight',
    duration: 4
  })
  
  // Add to store
  addDatabaseChange(change)
}

export const notify = {
  open: (opts) => open('open', opts),
  success: (opts) => open('success', opts),
  info: (opts) => open('info', opts),
  warning: (opts) => open('warning', opts),
  error: (opts) => open('error', opts),
  promise,
  databaseChange
}

// Export helper functions if needed elsewhere
export { getTableDisplayName, generateDatabaseChangeTitle, generateDatabaseChangeDescription }
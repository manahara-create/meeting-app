// store.js - Enhanced version
const LS_KEY = 'notifications.v2'
let notifications = []
const subscribers = new Set()

// Database change types for different operations
const DB_OPERATIONS = {
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
  FEEDBACK: 'feedback'
}

// Table display names mapping
const TABLE_DISPLAY_NAMES = {
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

function load() {
  try { 
    const raw = localStorage.getItem(LS_KEY)
    notifications = raw ? JSON.parse(raw) : []
  } catch (_) { 
    notifications = [] 
  }
}

function save() { 
  try { 
    // Keep only last 100 notifications to prevent storage bloat
    if (notifications.length > 100) {
      notifications = notifications.slice(-100)
    }
    localStorage.setItem(LS_KEY, JSON.stringify(notifications)) 
  } catch (_) {} 
}

function emit() { 
  const list = get()
  const unread = unreadCount()
  subscribers.forEach(cb => cb(list, unread)) 
}

function uid() { 
  return `${Date.now()}_${Math.random().toString(36).slice(2,8)}`
}

function getTableDisplayName(tableName) {
  return TABLE_DISPLAY_NAMES[tableName] || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function generateNotificationSummary(change) {
  const { table, operation, record, oldRecord } = change
  const tableDisplay = getTableDisplayName(table)
  
  switch (operation) {
    case DB_OPERATIONS.INSERT:
      return `New ${tableDisplay} created`
    
    case DB_OPERATIONS.UPDATE:
      return `${tableDisplay} updated`
    
    case DB_OPERATIONS.DELETE:
      return `${tableDisplay} deleted`
    
    case DB_OPERATIONS.FEEDBACK:
      return `New feedback on ${tableDisplay}`
    
    default:
      return `Change in ${tableDisplay}`
  }
}

function generateNotificationDescription(change) {
  const { table, operation, record, oldRecord } = change
  
  switch (operation) {
    case DB_OPERATIONS.INSERT:
      if (record.company) return `Company: ${record.company}`
      if (record.customer_name) return `Customer: ${record.customer_name}`
      if (record.meeting) return `Meeting: ${record.meeting}`
      return 'New record added'
    
    case DB_OPERATIONS.UPDATE:
      return 'Record has been modified'
    
    case DB_OPERATIONS.DELETE:
      return 'Record has been removed'
    
    case DB_OPERATIONS.FEEDBACK:
      if (record.content) return `Feedback: ${record.content.substring(0, 50)}...`
      return 'New feedback received'
    
    default:
      return 'Database change detected'
  }
}

export function get() { 
  return [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) 
}

export function unreadCount() { 
  return notifications.filter(n => !n.read).length 
}

export function addDatabaseChange(change) {
  const { table, operation, record, oldRecord, userId } = change
  
  const item = {
    id: uid(),
    type: 'info',
    title: generateNotificationSummary(change),
    description: generateNotificationDescription(change),
    meta: {
      table,
      operation,
      recordId: record?.id || oldRecord?.id,
      userId,
      timestamp: new Date().toISOString(),
      record: operation === DB_OPERATIONS.DELETE ? oldRecord : record,
      oldRecord: operation === DB_OPERATIONS.UPDATE ? oldRecord : null
    },
    createdAt: new Date().toISOString(),
    read: false,
    source: 'database'
  }
  
  notifications.push(item)
  save()
  emit()
  return item.id
}

export function add({ type = 'info', title, description, meta }) {
  const item = { 
    id: uid(), 
    type, 
    title, 
    description: description || null, 
    meta: meta || null, 
    createdAt: new Date().toISOString(), 
    read: false,
    source: 'system'
  }
  notifications.push(item)
  save()
  emit()
  return item.id
}

export function markRead(id, read = true) { 
  const n = notifications.find(x => x.id === id)
  if (n) { 
    n.read = read
    save()
    emit() 
  } 
}

export function markAllRead() { 
  notifications.forEach(n => n.read = true)
  save()
  emit() 
}

export function remove(id) { 
  notifications = notifications.filter(n => n.id !== id)
  save()
  emit() 
}

export function clear() { 
  notifications = []
  save()
  emit() 
}

export function onChange(cb) { 
  subscribers.add(cb)
  cb(get(), unreadCount())
  return () => subscribers.delete(cb) 
}

export function filterByTable(tableName) {
  return notifications.filter(n => n.meta?.table === tableName)
}

export function filterByOperation(operation) {
  return notifications.filter(n => n.meta?.operation === operation)
}

export function getRecentDatabaseChanges(limit = 20) {
  return notifications
    .filter(n => n.source === 'database')
    .slice(0, limit)
}

load()

export { DB_OPERATIONS }
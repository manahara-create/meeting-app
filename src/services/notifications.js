import { supabase } from './supabase';
import { notify } from '../components/notifications/notify';

// Notification types that match your DB_OPERATIONS
export const NOTIFICATION_TYPES = {
  CREATE: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
  DISCUSSION: 'feedback'
};

// Department mapping
export const DEPARTMENTS = {
  BDM: 'bdm',
  SALES_OPS: 'sales_operations',
  SCMT: 'scmt'
};

// Table to department mapping
export const TABLE_TO_DEPARTMENT = {
  // BDM Tables
  'bdm_college_session': 'bdm',
  'bdm_customer_visit': 'bdm',
  'bdm_principle_visit': 'bdm',
  'bdm_promotional_activities': 'bdm',
  'bdm_weekly_meetings': 'bdm',

  // Sales Operations Tables
  'sales_operations_meetings': 'sales_operations',
  'sales_operations_tasks': 'sales_operations',

  // SCMT Tables
  'scmt_d_n_d': 'scmt',
  'scmt_meetings_and_sessions': 'scmt',
  'scmt_others': 'scmt',
  'scmt_weekly_meetings': 'scmt',

  // Feedback Tables
  'bdm_college_session_fb': 'bdm',
  'bdm_customer_visit_fb': 'bdm',
  'bdm_principle_visit_fb': 'bdm',
  'bdm_promotional_activities_fb': 'bdm',
  'bdm_weekly_meetings_fb': 'bdm',
  'sales_operations_meetings_fb': 'sales_operations',
  'sales_operations_tasks_fb': 'sales_operations',
  'scmt_d_n_d_fb': 'scmt',
  'scmt_meetings_and_sessions_fb': 'scmt',
  'scmt_others_fb': 'scmt',
  'scmt_weekly_meetings_fb': 'scmt'
};

// Get category name from table
function getCategoryFromTable(tableName) {
  const categoryMap = {
    // BDM
    'bdm_college_session': 'College Sessions',
    'bdm_customer_visit': 'Customer Visits',
    'bdm_principle_visit': 'Principle Visits',
    'bdm_promotional_activities': 'Promotional Activities',
    'bdm_weekly_meetings': 'Weekly Meetings',

    // Sales Operations
    'sales_operations_meetings': 'Meetings',
    'sales_operations_tasks': 'Special Tasks',

    // SCMT
    'scmt_d_n_d': 'Delivery and Distribution',
    'scmt_meetings_and_sessions': 'Meetings and Sessions',
    'scmt_others': 'Other Operations',
    'scmt_weekly_meetings': 'Weekly Shipments'
  };

  return categoryMap[tableName] || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Create database change notification
export const notifyDepartmentOperation = async (
  tableName,
  operationType,
  record,
  additionalInfo = {}
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const department = TABLE_TO_DEPARTMENT[tableName] || 'unknown';
    const category = getCategoryFromTable(tableName);

    // Create the change object for your notification system
    const change = {
      table: tableName,
      operation: operationType,
      record: record,
      oldRecord: additionalInfo.oldRecord || null,
      userId: user?.id || additionalInfo.userId || null
    };

    // Use your existing notify.databaseChange function
    notify.databaseChange(change);

    // Also create a record in your notifications table if needed
    await createNotificationRecord({
      department,
      category,
      operationType,
      record,
      tableName,
      userId: user?.id,
      additionalInfo
    });

    return true;
  } catch (error) {
    console.error('Error in notifyDepartmentOperation:', error);
    return false;
  }
};

// Create record in notifications table (optional - if you want to persist in database)
const createNotificationRecord = async (notificationPayload) => {
  try {
    const { department, category, operationType, record, tableName, userId } = notificationPayload;

    let topic = '';
    const departmentName = getDepartmentDisplayName(department);

    switch (operationType) {
      case NOTIFICATION_TYPES.CREATE:
        topic = `New ${category} created in ${departmentName}`;
        break;
      case NOTIFICATION_TYPES.UPDATE:
        topic = `${category} updated in ${departmentName}`;
        break;
      case NOTIFICATION_TYPES.DELETE:
        topic = `${category} deleted from ${departmentName}`;
        break;
      case NOTIFICATION_TYPES.DISCUSSION:
        topic = `New discussion in ${category} - ${departmentName}`;
        break;
      default:
        topic = `Activity in ${category} - ${departmentName}`;
    }

    if (record) {
      const recordName = record.meeting || record.customer_name || record.company || record.type || 'Record';
      topic += `: ${recordName}`;
    }

    const notificationData = {
      changed_by: userId,
      status: 'active',
      topic,
      operation_type: operationType,
      record_id: record?.id,
      table_name: tableName,
      department_name: departmentName,
      category_name: category
    };

    // ✅ renamed variable here
    const { data: insertedData, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select();

    if (error) throw error;
    return insertedData?.[0];
  } catch (error) {
    console.error('Error creating notification record:', error);
    return null;
  }
};


// Helper function to get department display name
function getDepartmentDisplayName(department) {
  const displayNames = {
    'bdm': 'BDM Department',
    'sales_operations': 'Sales Operations Department',
    'scmt': 'SCMT Department'
  };

  return displayNames[department] || department;
}

// Simplified notification functions for direct use
export const notifyCreate = (tableName, record, additionalInfo = {}) => {
  return notifyDepartmentOperation(tableName, NOTIFICATION_TYPES.CREATE, record, additionalInfo);
};

export const notifyUpdate = (tableName, record, oldRecord = null, additionalInfo = {}) => {
  return notifyDepartmentOperation(tableName, NOTIFICATION_TYPES.UPDATE, record, {
    ...additionalInfo,
    oldRecord
  });
};

export const notifyDelete = (tableName, record, additionalInfo = {}) => {
  return notifyDepartmentOperation(tableName, NOTIFICATION_TYPES.DELETE, record, additionalInfo);
};

export const notifyDiscussion = (tableName, record, additionalInfo = {}) => {
  return notifyDepartmentOperation(tableName, NOTIFICATION_TYPES.DISCUSSION, record, additionalInfo);
};
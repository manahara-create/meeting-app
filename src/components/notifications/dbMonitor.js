// dbMonitor.js - Enhanced version
import { notify } from './notify'
import { DB_OPERATIONS } from './store'
import { TABLE_TO_DEPARTMENT, getCategoryFromTable } from '../services/notifications'

class DatabaseMonitor {
  // ... existing constructor and methods ...

  handleTableChange(tableName, payload) {
    let operation = DB_OPERATIONS.INSERT
    if (payload.eventType === 'UPDATE') operation = DB_OPERATIONS.UPDATE
    if (payload.eventType === 'DELETE') operation = DB_OPERATIONS.DELETE

    const department = TABLE_TO_DEPARTMENT[tableName] || 'unknown';
    const category = getCategoryFromTable(tableName);
    
    const change = {
      table: tableName,
      operation,
      record: payload.new,
      oldRecord: payload.old,
      userId: payload.new?.responsible_bdm || payload.new?.user_id || null,
      meta: {
        department,
        category,
        departmentName: this.getDepartmentDisplayName(department)
      }
    }

    notify.databaseChange(change)
  }

  handleFeedbackChange(tableName, payload) {
    const baseTable = tableName.replace('_fb', '');
    const department = TABLE_TO_DEPARTMENT[baseTable] || 'unknown';
    const category = getCategoryFromTable(baseTable);
    
    const change = {
      table: baseTable,
      operation: DB_OPERATIONS.FEEDBACK,
      record: payload.new,
      userId: payload.new?.sender_id,
      meta: {
        department,
        category,
        departmentName: this.getDepartmentDisplayName(department)
      }
    }

    notify.databaseChange(change)
  }

  getDepartmentDisplayName(department) {
    const displayNames = {
      'bdm': 'BDM Department',
      'sales_operations': 'Sales Operations Department',
      'scmt': 'SCMT Department'
    };
    return displayNames[department] || department;
  }
}

export default DatabaseMonitor
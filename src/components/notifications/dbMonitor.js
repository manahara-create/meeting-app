// dbMonitor.js
import { notify } from './notify'
import { DB_OPERATIONS } from './store'

class DatabaseMonitor {
  constructor(supabaseClient) {
    this.supabase = supabaseClient
    this.subscriptions = new Map()
    this.isMonitoring = false
  }

  // Start monitoring all relevant tables
  startMonitoring() {
    if (this.isMonitoring) return
    
    const tablesToMonitor = [
      'bdm_college_session',
      'bdm_customer_visit', 
      'bdm_principle_visit',
      'bdm_promotional_activities',
      'bdm_weekly_meetings',
      'sales_operations_meetings',
      'sales_operations_tasks',
      'scmt_d_n_d',
      'scmt_meetings_and_sessions',
      'scmt_others',
      'scmt_weekly_meetings',
      'meeting_requests',
      'messages'
    ]

    // Also monitor feedback tables
    const feedbackTables = [
      'bdm_college_session_fb',
      'bdm_customer_visit_fb',
      'bdm_principle_visit_fb',
      'bdm_promotional_activities_fb',
      'bdm_weekly_meetings_fb',
      'sales_operations_meetings_fb',
      'sales_operations_tasks_fb',
      'scmt_d_n_d_fb',
      'scmt_meetings_and_sessions_fb',
      'scmt_others_fb',
      'scmt_weekly_meetings_fb'
    ]

    tablesToMonitor.forEach(table => this.monitorTable(table))
    feedbackTables.forEach(table => this.monitorFeedbackTable(table))
    
    this.isMonitoring = true
    console.log('Database monitoring started')
  }

  monitorTable(tableName) {
    const subscription = this.supabase
      .channel(`table-changes-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          this.handleTableChange(tableName, payload)
        }
      )
      .subscribe()

    this.subscriptions.set(tableName, subscription)
  }

  monitorFeedbackTable(tableName) {
    const subscription = this.supabase
      .channel(`feedback-changes-${tableName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName
        },
        (payload) => {
          this.handleFeedbackChange(tableName, payload)
        }
      )
      .subscribe()

    this.subscriptions.set(tableName, subscription)
  }

  handleTableChange(tableName, payload) {
    let operation = DB_OPERATIONS.INSERT
    if (payload.eventType === 'UPDATE') operation = DB_OPERATIONS.UPDATE
    if (payload.eventType === 'DELETE') operation = DB_OPERATIONS.DELETE

    const change = {
      table: tableName,
      operation,
      record: payload.new,
      oldRecord: payload.old,
      userId: payload.new?.responsible_bdm || payload.new?.user_id || null
    }

    notify.databaseChange(change)
  }

  handleFeedbackChange(tableName, payload) {
    const change = {
      table: tableName.replace('_fb', ''),
      operation: DB_OPERATIONS.FEEDBACK,
      record: payload.new,
      userId: payload.new?.sender_id
    }

    notify.databaseChange(change)
  }

  stopMonitoring() {
    this.subscriptions.forEach((subscription, tableName) => {
      this.supabase.removeChannel(subscription)
    })
    this.subscriptions.clear()
    this.isMonitoring = false
    console.log('Database monitoring stopped')
  }

  // Monitor specific tables only
  monitorSpecificTables(tables) {
    this.stopMonitoring()
    tables.forEach(table => this.monitorTable(table))
  }
}

export default DatabaseMonitor
// Background Process for Weekly Record Check - Schedify App
import { supabase } from "../services/supabase.js";
import dayjs from 'dayjs';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_mkk3ny8';
const EMAILJS_TEMPLATE_ID = 'template_schedify_alerts'; 
const EMAILJS_PUBLIC_KEY = 'MhxrILdrk7ltKmDgh';
const EMAILJS_PRIVATE_KEY = 'ZOCs3mHeol8-_CMGlR-90';
const EMAILJS_USER_ID = 'schedifiy@gmail.com';

// Department configuration with responsible persons
const departmentConfig = {
    'After Sales': { person: 'Not Confirmed Yet', email: null },
    'BDM': { person: 'Prasadi Nuwanthika', email: 'prasadi.nuwanthika@biomedica.lk' },
    'Cluster 1': { person: 'Imesha Nilakshi', email: 'imesha.nilakshi@aipl.lk' },
    'Cluster 2': { person: 'Pradheesha Jeromie', email: 'pradheesha.jeromie@biomedica.lk' },
    'Cluster 3': { person: 'Gayathri Silva', email: 'gayathri.silva@biomedica.lk' },
    'Cluster 4': { person: 'Imesha Nilakshi', email: 'imesha.nilakshi@aipl.lk' },
    'Cluster 5': { person: 'Pradheesha Jeromie', email: 'pradheesha.jeromie@biomedica.lk' },
    'Cluster 6': { person: 'Gayathri Silva', email: 'gayathri.silva@biomedica.lk' },
    'Customer Care': { person: 'Rashmika Premathilaka', email: 'rashmika.premathilaka@biomedica.lk' },
    'E-Healthcare': { person: 'Dhara Nethmi', email: 'dhara.nethmi@aipl.lk' },
    'Finance': { person: 'Not Confirmed Yet', email: null },
    'Hi-Tech': { person: 'Sahiru Chathuranga', email: 'sahiru.chathuranga@aipl.lk' },
    'HR': { person: 'Nethmini Koshila', email: 'nethmini.koshila@aipl.lk' },
    'Imports': { person: 'Subhashini Sandamalie', email: 'subhashini.sandamali@aipl.lk' },
    'IT': { person: 'Not Yet Confirmed', email: null },
    'Regulatory': { person: 'Hiruni Achinthya', email: 'hiruni.achinthya@aipl.lk' },
    'Sales Operations': { person: 'Imesha Nilakshi', email: 'imesha.nilakshi@aipl.lk' },
    'Senior Management': { person: 'Madura Liyanaarachchi', email: 'mudusara@aipl.lk' },
    'SOMT': { person: 'Rahul Rupkumar', email: 'rahul.rupkumar@aipl.lk' },
    'Stores': { person: 'Suranga Silva', email: 'surangas@aipl.lk' },
    'Surge-Surgecare': { person: 'Shahan Anthony', email: 'shahan.anthony@aipl.lk' },
    'Surge-Surgecare-Image': { person: 'Selvarathnam Rajnikanth', email: 'selvarathnam.rajnikanth@aipl.lk' }
};

// Default CC email
const DEFAULT_CC_EMAIL = 'mudusara@aipl.lk';

// Table configuration with department mapping and date fields
const tableConfig = {
    // BDM Department Tables
    'bdm_college_session': { department: 'BDM', dateField: 'date', departmentId: '4755d627-64ad-4a03-81f2-fd867084cef7' },
    'bdm_meetings': { department: 'BDM', dateField: 'date', departmentId: '4755d627-64ad-4a03-81f2-fd867084cef7' },
    'bdm_principle_visit': { department: 'BDM', dateField: 'visit_duration_start', departmentId: '4755d627-64ad-4a03-81f2-fd867084cef7' },
    'bdm_promotional_activities': { department: 'BDM', dateField: 'date', departmentId: '4755d627-64ad-4a03-81f2-fd867084cef7' },
    'bdm_visit_plan': { department: 'BDM', dateField: 'schedule_date', departmentId: '4755d627-64ad-4a03-81f2-fd867084cef7' },

    // Cluster 1 Tables
    'cluster_1_meetings': { department: 'Cluster 1', dateField: 'date', departmentId: '20abd118-8884-4a5f-815c-ff876b4c1af9' },
    'cluster_1_special_task': { department: 'Cluster 1', dateField: 'date', departmentId: '20abd118-8884-4a5f-815c-ff876b4c1af9' },
    'cluster_1_visit_plan': { department: 'Cluster 1', dateField: 'date', departmentId: '20abd118-8884-4a5f-815c-ff876b4c1af9' },

    // Cluster 2 Tables
    'cluster_2_meetings': { department: 'Cluster 2', dateField: 'date', departmentId: '8bae5e38-9bc5-4da9-be2a-3aeec26d9ecf' },
    'cluster_2_special_task': { department: 'Cluster 2', dateField: 'date', departmentId: '8bae5e38-9bc5-4da9-be2a-3aeec26d9ecf' },
    'cluster_2_visit_plan': { department: 'Cluster 2', dateField: 'date', departmentId: '8bae5e38-9bc5-4da9-be2a-3aeec26d9ecf' },

    // Cluster 3 Tables
    'cluster_3_meetings': { department: 'Cluster 3', dateField: 'date', departmentId: '7be34254-5e43-4a52-ae15-3a878d49e39b' },
    'cluster_3_special_task': { department: 'Cluster 3', dateField: 'date', departmentId: '7be34254-5e43-4a52-ae15-3a878d49e39b' },
    'cluster_3_visit_plan': { department: 'Cluster 3', dateField: 'date', departmentId: '7be34254-5e43-4a52-ae15-3a878d49e39b' },

    // Cluster 4 Tables
    'cluster_4_meetings': { department: 'Cluster 4', dateField: 'date', departmentId: '3f8b1f38-a580-43a7-9478-870cad30d6ad' },
    'cluster_4_special_task': { department: 'Cluster 4', dateField: 'date', departmentId: '3f8b1f38-a580-43a7-9478-870cad30d6ad' },
    'cluster_4_visit_plan': { department: 'Cluster 4', dateField: 'date', departmentId: '3f8b1f38-a580-43a7-9478-870cad30d6ad' },

    // Cluster 5 Tables
    'cluster_5_meetings': { department: 'Cluster 5', dateField: 'date', departmentId: '95dfb80f-b434-4c49-ba1e-e65dbab60047' },
    'cluster_5_special_task': { department: 'Cluster 5', dateField: 'date', departmentId: '95dfb80f-b434-4c49-ba1e-e65dbab60047' },
    'cluster_5_visit_plan': { department: 'Cluster 5', dateField: 'date', departmentId: '95dfb80f-b434-4c49-ba1e-e65dbab60047' },

    // Cluster 6 Tables
    'cluster_6_meetings': { department: 'Cluster 6', dateField: 'date', departmentId: 'f9d97e18-2601-4988-8cb5-255d64cf98a9' },
    'cluster_6_special_task': { department: 'Cluster 6', dateField: 'date', departmentId: 'f9d97e18-2601-4988-8cb5-255d64cf98a9' },
    'cluster_6_visit_plan': { department: 'Cluster 6', dateField: 'date', departmentId: 'f9d97e18-2601-4988-8cb5-255d64cf98a9' },

    // Customer Care Tables
    'customer_care_delivery_schedule': { department: 'Customer Care', dateField: 'delivery_date', departmentId: '5929ffc6-c282-4282-9cd4-351435e73fda' },
    'customer_care_meetings': { department: 'Customer Care', dateField: 'date', departmentId: '5929ffc6-c282-4282-9cd4-351435e73fda' },
    'customer_care_special_tasks': { department: 'Customer Care', dateField: 'date', departmentId: '5929ffc6-c282-4282-9cd4-351435e73fda' },

    // E-Healthcare Tables
    'ehealthcare_meetings': { department: 'E-Healthcare', dateField: 'date', departmentId: 'a5489f85-b621-488b-864d-9edd1e40f8e3' },
    'ehealthcare_visit_plan': { department: 'E-Healthcare', dateField: 'date', departmentId: 'a5489f85-b621-488b-864d-9edd1e40f8e3' },

    // Hi-Tech Tables
    'hitech_page_generation': { department: 'Hi-Tech', dateField: 'created_at', departmentId: '7483633e-a502-4eab-8828-a9d7a6649394' },
    'hitech_technical_discussions': { department: 'Hi-Tech', dateField: 'created_at', departmentId: '7483633e-a502-4eab-8828-a9d7a6649394' },
    'hitech_tender_validation': { department: 'Hi-Tech', dateField: 'date', departmentId: '7483633e-a502-4eab-8828-a9d7a6649394' },
    'hitech_visit_plan': { department: 'Hi-Tech', dateField: 'date', departmentId: '7483633e-a502-4eab-8828-a9d7a6649394' },

    // HR Tables
    'hr_meetings': { department: 'HR', dateField: 'date', departmentId: '4f64ea9f-879c-4232-b658-3599098bff26' },
    'hr_special_events_n_tasks': { department: 'HR', dateField: 'date', departmentId: '4f64ea9f-879c-4232-b658-3599098bff26' },
    'hr_training': { department: 'HR', dateField: 'date', departmentId: '4f64ea9f-879c-4232-b658-3599098bff26' },

    // Imports Tables
    'imports_meetings': { department: 'Imports', dateField: 'date', departmentId: 'd416f2f6-b9aa-4282-9ece-f5a74c54e4e4' },
    'imports_upcoming_shipment_clearance_plan': { department: 'Imports', dateField: 'eta', departmentId: 'd416f2f6-b9aa-4282-9ece-f5a74c54e4e4' },

    // Regulatory Tables
    'regulatory_meetings': { department: 'Regulatory', dateField: 'date', departmentId: '6e087a71-6f40-49c8-b69d-e435e3a06279' },
    'regulatory_submissions': { department: 'Regulatory', dateField: 'date', departmentId: '6e087a71-6f40-49c8-b69d-e435e3a06279' },

    // Sales Operations Tables
    'sales_operations_meetings': { department: 'Sales Operations', dateField: 'date', departmentId: '0d9e7bc7-37e5-4e00-80a2-a6f48235f4da' },
    'sales_operations_special_tasks': { department: 'Sales Operations', dateField: 'date', departmentId: '0d9e7bc7-37e5-4e00-80a2-a6f48235f4da' },

    // Senior Management Tables
    'senior_management_meetings': { department: 'Senior Management', dateField: 'date', departmentId: '0d02caa0-c45f-4448-8589-717a64466958' },
    'senior_management_special_task': { department: 'Senior Management', dateField: 'date', departmentId: '0d02caa0-c45f-4448-8589-717a64466958' },

    // SOMT Tables
    'somt_meetings': { department: 'SOMT', dateField: 'date', departmentId: 'ff865706-9b6b-4754-b499-550092556b19' },
    'somt_tender': { department: 'SOMT', dateField: 'close_date', departmentId: 'ff865706-9b6b-4754-b499-550092556b19' },

    // Stores Tables
    'stores_plan_loading': { department: 'Stores', dateField: 'date', departmentId: '001f7425-c458-4b8b-9158-ba8425c89c24' },
    'stores_vst': { department: 'Stores', dateField: 'date', departmentId: '001f7425-c458-4b8b-9158-ba8425c89c24' },

    // Surge Imaging Tables
    'surgi_imaging_college_session': { department: 'Surge-Surgecare-Image', dateField: 'date', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },
    'surgi_imaging_meetings': { department: 'Surge-Surgecare-Image', dateField: 'date', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },
    'surgi_imaging_principal_visit': { department: 'Surge-Surgecare-Image', dateField: 'start_time', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },
    'surgi_imaging_promotional_activities': { department: 'Surge-Surgecare-Image', dateField: 'date', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },
    'surgi_imaging_special_tasks': { department: 'Surge-Surgecare-Image', dateField: 'date', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },
    'surgi_imaging_visit_plan': { department: 'Surge-Surgecare-Image', dateField: 'schedule_date', departmentId: '3b55797c-3170-46ce-9119-6cd6ec74b6ec' },

    // Surge Surgicare Tables
    'surgi_surgicare_college_session': { department: 'Surge-Surgecare', dateField: 'date', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' },
    'surgi_surgicare_meetings': { department: 'Surge-Surgecare', dateField: 'date', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' },
    'surgi_surgicare_principal_visit': { department: 'Surge-Surgecare', dateField: 'visit_duration_start', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' },
    'surgi_surgicare_promotional_activities': { department: 'Surge-Surgecare', dateField: 'date', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' },
    'surgi_surgicare_special_task': { department: 'Surge-Surgecare', dateField: 'date', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' },
    'surgi_surgicare_visit_plan': { department: 'Surge-Surgecare', dateField: 'schedule_date', departmentId: '6b7336d6-16de-4d41-8f41-6c00d8d06b0f' }
};

// Function to check if today is Monday
function isMonday() {
    const today = new Date();
    console.log(`📅 Today is: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    return today.getDay() === 1; // 0 = Sunday, 1 = Monday
}

// Function to check if current time is 09:00 AM
function isNineAM() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    console.log(`⏰ Current time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    return hours === 9 && minutes === 0;
}

// Function to check if email was already sent this week
async function checkEmailSentThisWeek() {
    try {
        const startOfWeek = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'); // Monday of current week
        
        const { data, error } = await supabase
            .from('schedify_email_logs')
            .select('sent_date')
            .gte('sent_date', startOfWeek)
            .limit(1);

        if (error) {
            console.error('❌ Error checking email log:', error);
            return false; // If error, assume not sent to allow retry
        }

        const emailSentThisWeek = data && data.length > 0;
        console.log(`📧 Email sent this week: ${emailSentThisWeek ? 'YES' : 'NO'}`);
        
        return emailSentThisWeek;
    } catch (error) {
        console.error('❌ Exception checking email log:', error);
        return false;
    }
}

// Function to log email sent
async function logEmailSent(department, weekRange) {
    try {
        const { data, error } = await supabase
            .from('schedify_email_logs')
            .insert([
                {
                    department: department,
                    week_range: weekRange,
                    sent_date: new Date().toISOString(),
                    sent_timestamp: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('❌ Error logging email:', error);
            return false;
        }

        console.log(`✅ Email logged for ${department} - Week: ${weekRange}`);
        return true;
    } catch (error) {
        console.error('❌ Exception logging email:', error);
        return false;
    }
}

// Function to get last 5 days date range
function getLast5DaysRange() {
    const today = dayjs();
    const fiveDaysAgo = today.subtract(6, 'day');

    return {
        startDate: fiveDaysAgo.format('YYYY-MM-DD'),
        endDate: today.format('YYYY-MM-DD'),
        dateRange: `${fiveDaysAgo.format('DD MMM YYYY')} - ${today.format('DD MMM YYYY')}`
    };
}

// Function to check if department has any records in last 5 days
async function checkDepartmentHasRecords(department) {
    try {
        const { startDate, endDate } = getLast5DaysRange();
        const departmentTables = Object.entries(tableConfig)
            .filter(([tableName, config]) => config.department === department)
            .map(([tableName, config]) => ({ tableName, config }));

        console.log(`🔍 Checking ${department} - Last 5 days (${startDate} to ${endDate})`);
        console.log(`📊 Tables to check: ${departmentTables.map(t => t.tableName).join(', ')}`);

        let hasAnyRecords = false;

        for (const { tableName, config } of departmentTables) {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .gte(config.dateField, startDate)
                .lte(config.dateField, endDate);

            if (error) {
                console.error(`❌ Error checking table ${tableName}:`, error);
                continue;
            }

            if (count > 0) {
                console.log(`✅ ${tableName} has ${count} records in last 5 days`);
                hasAnyRecords = true;
                break; // Stop checking if at least one table has records
            } else {
                console.log(`❌ ${tableName} has NO records in last 5 days`);
            }
        }

        console.log(`📋 ${department} - Has records in last 5 days: ${hasAnyRecords ? 'YES' : 'NO'}`);
        return hasAnyRecords;
    } catch (error) {
        console.error(`❌ Exception checking department ${department}:`, error);
        return false; // If error, assume no records to be safe
    }
}

// Function to send email notification using EmailJS
async function sendEmailJSEmail(to, cc, subject, htmlContent, department, person, weekRange) {
    try {
        console.log(`📧 Attempting to send EmailJS email to: ${to}, CC: ${cc}`);

        // Prepare template parameters for EmailJS
        const templateParams = {
            to_email: to,
            cc_email: cc || '',
            subject: subject,
            department: department,
            person_name: person,
            week_range: weekRange,
            from_name: 'Schedify - Powered by E-Healthcare Solutions',
            reply_to: 'noreply@schedify.eHealthcare.lk',
            current_year: new Date().getFullYear().toString()
        };

        console.log('📨 EmailJS template params prepared:', {
            to_email: to,
            cc_email: cc,
            subject: subject,
            department: department
        });

        // Send email using EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: EMAILJS_SERVICE_ID,
                template_id: EMAILJS_TEMPLATE_ID,
                user_id: EMAILJS_PUBLIC_KEY,
                template_params: templateParams,
                accessToken: EMAILJS_PRIVATE_KEY
            })
        });

        console.log(`📨 EmailJS API Response Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ EmailJS API error response:`, errorText);
            throw new Error(`EmailJS API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ EmailJS email sent successfully');
        return { success: true, result: result };
    } catch (error) {
        console.error('❌ EmailJS email sending failed:', error);
        return { success: false, error: error.message };
    }
}

// Function to send department notification
async function sendDepartmentNotification(department, weekRange) {
    const deptConfig = departmentConfig[department];

    if (!deptConfig || !deptConfig.email) {
        console.log(`⚠️ No email configured for department: ${department}`);
        return false;
    }

    const subject = `🚨 Schedify Alert - No Records Found - ${department} - Week ${weekRange}`;

    // Create HTML content for the email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f9f9f9;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px;
            font-weight: bold;
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9;
            font-size: 16px;
        }
        .content { 
            padding: 30px; 
        }
        .alert { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border-left: 4px solid #ffc107;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .highlight { 
            background: #fff3cd; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Schedify Alert</h1>
            <p>No Records Found - ${department}</p>
        </div>
        <div class="content">
            <p>Dear <strong>${deptConfig.person}</strong>,</p>
            
            <div class="alert">
                <p style="margin: 0;">This is an automated notification from <strong>Schedify - The Schedule Application For Analytical Instruments</strong>.</p>
            </div>

            <p>We have detected that your department (<span class="highlight">${department}</span>) has <span class="highlight">NO records</span> in any of the scheduled tables for the last 5 days.</p>

            <p><strong>Week:</strong> ${weekRange}</p>
            <p><strong>Check Period:</strong> Last 5 days</p>

            <h3>📋 Action Required:</h3>
            <p>Please ensure that relevant records are entered into Schedify to maintain:</p>
            <ul>
                <li>Data completeness and accuracy</li>
                <li>Operational visibility</li>
                <li>Compliance with reporting requirements</li>
            </ul>
            
            <p>If you have already entered records but are still receiving this notification, or if you need assistance, please contact the IT department.</p>

            <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>Schedify - Automated Monitoring System</strong><br>
                <em>Powered by E-Healthcare Solutions</em>
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} AIPL - Analytical Instruments (Private) Limited. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        console.log(`📧 Preparing to send email for ${department} to ${deptConfig.email}`);
        
        const result = await sendEmailJSEmail(
            deptConfig.email, 
            DEFAULT_CC_EMAIL, 
            subject, 
            htmlContent,
            department,
            deptConfig.person,
            weekRange
        );

        if (result.success) {
            console.log(`✅ Email sent successfully for ${department}`);
            // Log the email sent
            await logEmailSent(department, weekRange);
            return true;
        } else {
            console.error(`❌ Failed to send email for ${department}:`, result.error);
            return false;
        }
    } catch (error) {
        console.error(`❌ Exception sending email for ${department}:`, error);
        return false;
    }
}

// Main function to perform weekly record check
export async function performWeeklyRecordCheck() {
    console.log('🚀 Schedify - Starting weekly record check...');
    console.log('📅 Date:', new Date().toISOString());

    // Check if today is Monday
    if (!isMonday()) {
        console.log('❌ Today is not Monday. Weekly check aborted.');
        return {
            status: 'skipped',
            reason: 'Not Monday',
            timestamp: new Date().toISOString()
        };
    }

    // Check if it's 09:00 AM
    if (!isNineAM()) {
        console.log('❌ Current time is not 09:00 AM. Weekly check aborted.');
        return {
            status: 'skipped',
            reason: 'Not 09:00 AM',
            timestamp: new Date().toISOString()
        };
    }

    // Check if email was already sent this week
    const emailAlreadySent = await checkEmailSentThisWeek();
    if (emailAlreadySent) {
        console.log('❌ Email already sent this week. Weekly check aborted.');
        return {
            status: 'skipped',
            reason: 'Email already sent this week',
            timestamp: new Date().toISOString()
        };
    }

    console.log('✅ Conditions met: Monday, 09:00 AM, no email sent this week');
    
    const { dateRange } = getLast5DaysRange();
    console.log(`📆 Checking last 5 days: ${dateRange}`);

    let departmentsNotified = 0;
    let totalDepartmentsChecked = 0;

    // Check each department
    for (const [department, deptConfig] of Object.entries(departmentConfig)) {
        // Skip departments without email configuration
        if (!deptConfig.email) {
            console.log(`⏭️ Skipping ${department} - No email configured`);
            continue;
        }

        totalDepartmentsChecked++;
        console.log(`\n🔍 Processing department: ${department}`);

        // Check if department has any records in last 5 days
        const hasRecords = await checkDepartmentHasRecords(department);

        if (!hasRecords) {
            console.log(`🚨 ${department} has NO records in last 5 days - Sending notification`);
            const notificationSent = await sendDepartmentNotification(department, dateRange);
            
            if (notificationSent) {
                departmentsNotified++;
                console.log(`✅ Notification sent successfully for ${department}`);
            } else {
                console.log(`❌ Failed to send notification for ${department}`);
            }
        } else {
            console.log(`✅ ${department} has records in last 5 days - No notification needed`);
        }
    }

    console.log('\n📊 WEEKLY CHECK SUMMARY:');
    console.log(`📅 Check Period: ${dateRange}`);
    console.log(`🏢 Total Departments Checked: ${totalDepartmentsChecked}`);
    console.log(`📧 Departments Notified: ${departmentsNotified}`);
    console.log('🎯 Weekly record check completed!');

    return {
        status: 'completed',
        departmentsChecked: totalDepartmentsChecked,
        departmentsNotified: departmentsNotified,
        checkPeriod: dateRange,
        timestamp: new Date().toISOString()
    };
}

// Scheduler that runs every minute to check if it's Monday 09:00 AM
export function scheduleWeeklyCheck() {
    console.log('⏰ Schedify - Starting weekly check scheduler...');
    
    // Check every minute
    setInterval(async () => {
        const now = new Date();
        const isMondayToday = now.getDay() === 1;
        const isNineAMNow = now.getHours() === 9 && now.getMinutes() === 0;

        console.log(`⏰ Scheduler check - Monday: ${isMondayToday}, 09:00: ${isNineAMNow}`);

        if (isMondayToday && isNineAMNow) {
            console.log('🎯 Scheduler triggered - Monday 09:00 AM detected');
            try {
                await performWeeklyRecordCheck();
            } catch (error) {
                console.error('❌ Error in scheduled weekly check:', error);
            }
        }
    }, 60 * 1000); // Check every minute

    console.log('✅ Weekly check scheduler started - Checking every minute for Monday 09:00 AM');
}

// Manual trigger for testing (bypasses day/time checks)
export async function manualTrigger() {
    console.log('🔧 Schedify - Manual trigger activated (bypassing day/time checks)');
    
    // Bypass the Monday and 09:00 AM checks for manual testing
    console.log('🚀 Bypassing day/time checks for manual testing');
    
    const { dateRange } = getLast5DaysRange();
    console.log(`📆 Checking last 5 days: ${dateRange}`);

    let departmentsNotified = 0;
    let totalDepartmentsChecked = 0;

    // Check each department
    for (const [department, deptConfig] of Object.entries(departmentConfig)) {
        if (!deptConfig.email) {
            console.log(`⏭️ Skipping ${department} - No email configured`);
            continue;
        }

        totalDepartmentsChecked++;
        console.log(`\n🔍 Processing department: ${department}`);

        const hasRecords = await checkDepartmentHasRecords(department);

        if (!hasRecords) {
            console.log(`🚨 ${department} has NO records in last 5 days - Sending notification`);
            const notificationSent = await sendDepartmentNotification(department, dateRange);
            
            if (notificationSent) {
                departmentsNotified++;
                console.log(`✅ Notification sent successfully for ${department}`);
            } else {
                console.log(`❌ Failed to send notification for ${department}`);
            }
        } else {
            console.log(`✅ ${department} has records in last 5 days - No notification needed`);
        }
    }

    console.log('\n📊 MANUAL CHECK SUMMARY:');
    console.log(`📅 Check Period: ${dateRange}`);
    console.log(`🏢 Total Departments Checked: ${totalDepartmentsChecked}`);
    console.log(`📧 Departments Notified: ${departmentsNotified}`);
    
    return {
        status: 'manual_completed',
        departmentsChecked: totalDepartmentsChecked,
        departmentsNotified: departmentsNotified,
        checkPeriod: dateRange,
        timestamp: new Date().toISOString()
    };
}

// Initialize
console.log('📧 Schedify Weekly Check System Initialized');
console.log(`   Service: ${EMAILJS_SERVICE_ID}`);
console.log(`   Departments: ${Object.keys(departmentConfig).length}`);
console.log(`   Tables: ${Object.keys(tableConfig).length}`);
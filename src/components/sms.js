<<<<<<< HEAD
=======
// Background Process for Weekly Record Check - Schedify App
import { supabase } from "../services/supabase.js";
import dayjs from 'dayjs';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_7gvmz1r';
const EMAILJS_TEMPLATE_ID = 'template_schedify_alerts'; 
const EMAILJS_PUBLIC_KEY = 'wbvU9LIDP6q2LBmOs';
const EMAILJS_PRIVATE_KEY = 'S9G9d7LGI5MjaGDKK8QXC';
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

// Function to get current week date range (Monday to Saturday)
function getCurrentWeekRange() {
    const today = dayjs();
    const startOfWeek = today.startOf('week').add(1, 'day'); // Monday
    const endOfWeek = startOfWeek.add(5, 'day'); // Saturday

    return {
        startDate: startOfWeek.format('YYYY-MM-DD'),
        endDate: endOfWeek.format('YYYY-MM-DD'),
        weekRange: `${startOfWeek.format('DD MMM YYYY')} - ${endOfWeek.format('DD MMM YYYY')}`
    };
}

// Function to check records for a specific table
async function checkTableRecords(tableName, config) {
    try {
        const { startDate, endDate } = getCurrentWeekRange();

        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .gte(config.dateField, startDate)
            .lte(config.dateField, endDate);

        if (error) {
            console.error(`Error checking table ${tableName}:`, error);
            return { hasRecords: false, error: error.message };
        }

        return {
            hasRecords: count > 0,
            recordCount: count,
            tableName,
            department: config.department,
            dateField: config.dateField,
            dateRange: `${startDate} to ${endDate}`
        };
    } catch (error) {
        console.error(`Exception checking table ${tableName}:`, error);
        return { hasRecords: false, error: error.message };
    }
}

// Function to send email notification using EmailJS
async function sendEmailJSEmail(to, cc, subject, htmlContent, department, person, missingTables, weekRange) {
    try {
        console.log(`📧 Attempting to send EmailJS email to: ${to}, CC: ${cc}`);
        console.log(`🔑 Using EmailJS Service ID: ${EMAILJS_SERVICE_ID}`);

        // Prepare template parameters for EmailJS
        const templateParams = {
            to_email: to,
            cc_email: cc || '',
            subject: subject,
            department: department,
            person_name: person,
            week_range: weekRange,
            missing_tables_count: missingTables.length,
            missing_tables_list: missingTables.join(', '),
            html_content: htmlContent,
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
            
            let errorMessage = `EmailJS API error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = `EmailJS API error: ${errorData.message || errorData.error || response.statusText}`;
            } catch (e) {
                // If JSON parsing fails, use the text response
                errorMessage = `EmailJS API error: ${response.status} - ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('✅ EmailJS email sent successfully:', result);
        return { success: true, result: result };
    } catch (error) {
        console.error('❌ EmailJS email sending failed:', error);
        return { success: false, error: error.message };
    }
}

// Alternative EmailJS function using their recommended format
async function sendEmailJSAlternative(to, cc, subject, htmlContent, department, person, missingTables, weekRange) {
    try {
        console.log(`📧 Attempting to send EmailJS email (alternative method) to: ${to}`);

        // Create a plain text version for email clients that don't support HTML
        const plainText = `
Schedify Alert - Missing Records
Department: ${department}
Person: ${person}
Week: ${weekRange}

Missing Tables (${missingTables.length}):
${missingTables.map((table, index) => `${index + 1}. ${table}`).join('\n')}

Action Required:
Please ensure that all relevant records are entered into Schedify for the current week to maintain data completeness and operational visibility.

This is an automated message from Schedify - The Schedule Application For Analytical Instruments.
        `.trim();

        const templateParams = {
            to_email: to,
            cc_email: cc || '',
            subject: subject,
            department: department,
            person_name: person,
            week_range: weekRange,
            missing_tables_count: missingTables.length.toString(),
            missing_tables_list: missingTables.join('\n'),
            message: plainText,
            html_content: htmlContent,
            from_name: 'Schedify - Powered by E-Healthcare Solutions',
            reply_to: 'noreply@schedify.eHealthcare.lk'
        };

        const emailData = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            template_params: templateParams,
            accessToken: EMAILJS_PRIVATE_KEY
        };

        console.log('📨 Sending EmailJS request...');
        
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`EmailJS error: ${response.status} - ${errorText}`);
        }

        const result = await response.text(); // EmailJS returns text response
        console.log('✅ EmailJS email sent successfully');
        return { success: true, result: result };
    } catch (error) {
        console.error('❌ EmailJS alternative method failed:', error);
        return { success: false, error: error.message };
    }
}

// Function to send email notification
async function sendEmailNotification(department, missingTables, weekRange) {
    const deptConfig = departmentConfig[department];

    if (!deptConfig || !deptConfig.email) {
        console.log(`⚠️ No email configured for department: ${department}`);
        return false;
    }

    const subject = `🚨 Schedify Alert - Missing Records - ${department} - Week ${weekRange}`;

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
        .table-list { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
            border: 1px solid #e9ecef;
        }
        .table-list ul { 
            margin: 0; 
            padding-left: 20px; 
        }
        .table-list li { 
            margin-bottom: 8px; 
            padding: 5px 0;
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
        .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
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
            <p>Missing Records Notification - ${department}</p>
        </div>
        <div class="content">
            <p>Dear <strong>${deptConfig.person}</strong>,</p>
            
            <div class="alert">
                <p style="margin: 0;">This is an automated notification from <strong>Schedify - The Schedule Application For Analytical Instruments</strong>.</p>
            </div>

            <p>We have detected that the following tables in your department (<span class="highlight">${department}</span>) have <span class="highlight">NO records</span> for the current week (<span class="highlight">${weekRange}</span>):</p>

            <div class="table-list">
                <h3 style="margin-top: 0; color: #dc3545;">Missing Tables (${missingTables.length}):</h3>
                <ul>
                    ${missingTables.map(table => `<li><strong>${table}</strong></li>`).join('')}
                </ul>
            </div>

            <h3>📋 Action Required:</h3>
            <p>Please ensure that all relevant records are entered into Schedify for the current week to maintain:</p>
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
        
        // Try the main EmailJS function first
        let result = await sendEmailJSEmail(
            deptConfig.email, 
            DEFAULT_CC_EMAIL, 
            subject, 
            htmlContent,
            department,
            deptConfig.person,
            missingTables,
            weekRange
        );

        // If main method fails, try alternative method
        if (!result.success) {
            console.log('🔄 Trying alternative EmailJS method...');
            result = await sendEmailJSAlternative(
                deptConfig.email, 
                DEFAULT_CC_EMAIL, 
                subject, 
                htmlContent,
                department,
                deptConfig.person,
                missingTables,
                weekRange
            );
        }

        if (result.success) {
            console.log(`✅ EmailJS email sent successfully for ${department}`);
            return true;
        } else {
            console.error(`❌ Failed to send EmailJS email for ${department}:`, result.error);
            return false;
        }
    } catch (error) {
        console.error(`❌ Exception sending EmailJS email for ${department}:`, error);
        return false;
    }
}

// Main function to check all tables and send notifications
export async function performWeeklyRecordCheck() {
    console.log('🚀 Schedify - Starting weekly record check...');
    console.log('📅 Date:', new Date().toISOString());
    console.log(`🔑 EmailJS Configuration:`);
    console.log(`   Service ID: ${EMAILJS_SERVICE_ID}`);
    console.log(`   Public Key: ${EMAILJS_PUBLIC_KEY ? 'Present' : 'MISSING'}`);
    console.log(`   Private Key: ${EMAILJS_PRIVATE_KEY ? 'Present' : 'MISSING'}`);

    const { weekRange } = getCurrentWeekRange();
    console.log(`📆 Checking week: ${weekRange}`);

    const departmentResults = {};
    const allTableResults = [];

    // Check all tables
    for (const [tableName, config] of Object.entries(tableConfig)) {
        console.log(`🔍 Checking table: ${tableName}`);

        const result = await checkTableRecords(tableName, config);
        allTableResults.push(result);

        // Group by department
        if (!departmentResults[config.department]) {
            departmentResults[config.department] = [];
        }
        departmentResults[config.department].push(result);
    }

    // Process results and send notifications
    let totalNotifications = 0;
    let successfulNotifications = 0;

    for (const [department, tableResults] of Object.entries(departmentResults)) {
        const missingTables = tableResults
            .filter(result => !result.hasRecords)
            .map(result => result.tableName);

        if (missingTables.length > 0) {
            console.log(`⚠️  Department ${department} has ${missingTables.length} missing tables:`, missingTables);

            if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID) {
                const notificationSent = await sendEmailNotification(department, missingTables, weekRange);
                if (notificationSent) {
                    successfulNotifications++;
                    totalNotifications++;
                } else {
                    totalNotifications++; // Count attempted notifications
                }
            } else {
                console.log(`❌ Skipping email for ${department} - EmailJS not properly configured`);
            }
        } else {
            console.log(`✅ Department ${department}: All tables have records`);
        }
    }

    // Generate summary report
    const totalTables = allTableResults.length;
    const tablesWithRecords = allTableResults.filter(r => r.hasRecords).length;
    const tablesWithoutRecords = allTableResults.filter(r => !r.hasRecords).length;

    console.log('\n📊 SCHEDIFY WEEKLY CHECK SUMMARY:');
    console.log(`📅 Week: ${weekRange}`);
    console.log(`📋 Total Tables Checked: ${totalTables}`);
    console.log(`✅ Tables With Records: ${tablesWithRecords}`);
    console.log(`❌ Tables Without Records: ${tablesWithoutRecords}`);
    console.log(`📧 Notifications Attempted: ${totalNotifications}`);
    console.log(`✅ Successful Notifications: ${successfulNotifications}`);
    console.log('🎯 Weekly record check completed!');

    // Log the result to a monitoring table
    await logWeeklyCheckResult({
        weekRange,
        totalTables,
        tablesWithRecords,
        tablesWithoutRecords,
        notificationsSent: successfulNotifications,
        timestamp: new Date().toISOString()
    });

    return {
        weekRange,
        totalTables,
        tablesWithRecords,
        tablesWithoutRecords,
        notificationsAttempted: totalNotifications,
        notificationsSuccessful: successfulNotifications,
        timestamp: new Date().toISOString()
    };
}

// Function to log weekly check results to database
async function logWeeklyCheckResult(result) {
    try {
        const { data, error } = await supabase
            .from('schedify_weekly_checks')
            .insert([
                {
                    week_range: result.weekRange,
                    total_tables: result.totalTables,
                    tables_with_records: result.tablesWithRecords,
                    tables_without_records: result.tablesWithoutRecords,
                    notifications_sent: result.notificationsSent,
                    check_timestamp: result.timestamp
                }
            ]);

        if (error) {
            console.error('Error logging weekly check result:', error);
            return;
        }

        console.log('✅ Weekly check result logged to database');
    } catch (error) {
        console.error('Exception logging weekly check result:', error);
    }
}

// Simple scheduler using setTimeout (runs every Monday at 9:00 AM)
export function scheduleWeeklyCheck() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Calculate milliseconds until next Monday 9:00 AM
    let daysUntilMonday = (8 - dayOfWeek) % 7; // 1 for Monday
    if (daysUntilMonday === 0 && (hours < 9 || (hours === 9 && minutes === 0))) {
        daysUntilMonday = 0; // Today is Monday but before 9:00 AM
    } else if (daysUntilMonday === 0) {
        daysUntilMonday = 7; // Today is Monday but after 9:00 AM, go to next Monday
    }
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(9, 0, 0, 0);
    
    const msUntilNextMonday = nextMonday.getTime() - now.getTime();
    
    console.log(`⏰ Next weekly check scheduled for: ${nextMonday.toLocaleString()}`);
    
    // Schedule the first run
    setTimeout(() => {
        console.log('⏰ Schedify - Scheduled weekly record check started...');
        performWeeklyRecordCheck().catch(console.error);
        
        // Schedule subsequent runs (every 7 days)
        setInterval(() => {
            console.log('⏰ Schedify - Scheduled weekly record check started...');
            performWeeklyRecordCheck().catch(console.error);
        }, 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
    }, msUntilNextMonday);
}

// Alternative scheduler using setInterval with daily check for Monday 9:00 AM
export function scheduleWeeklyCheckDaily() {
    // Check every day at 9:00 AM if it's Monday
    const now = new Date();
    const checkTime = new Date(now);
    checkTime.setHours(9, 0, 0, 0);
    
    let initialDelay = checkTime.getTime() - now.getTime();
    if (initialDelay < 0) {
        initialDelay += 24 * 60 * 60 * 1000; // Add 24 hours if already past 9:00 AM today
    }
    
    console.log(`⏰ Daily scheduler started. Next check in ${Math.round(initialDelay / 1000 / 60)} minutes`);
    
    setTimeout(() => {
        // Initial check
        checkAndRunIfMonday();
        
        // Then check every 24 hours
        setInterval(checkAndRunIfMonday, 24 * 60 * 60 * 1000);
    }, initialDelay);
    
    async function checkAndRunIfMonday() {
        const today = new Date();
        if (today.getDay() === 1) { // Monday
            console.log('⏰ Schedify - Scheduled weekly record check started (Monday 9:00 AM)...');
            await performWeeklyRecordCheck();
        } else {
            console.log(`⏰ Daily check: Today is not Monday (${today.toLocaleDateString('en-US', { weekday: 'long'})}), skipping weekly check.`);
        }
    }
}

// Manual trigger function (for testing)
export async function manualTrigger() {
    console.log('🔧 Schedify - Manual trigger activated');
    return await performWeeklyRecordCheck();
}

// Test function to verify EmailJS connection
export async function testEmailJSConnection() {
    console.log('🧪 Testing EmailJS connection...');
    
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID) {
        console.error('❌ EmailJS not properly configured');
        return false;
    }

    try {
        // Test by sending a simple email
        const testEmail = 'schedifiy@gmail.com';
        const testSubject = '🧪 Schedify - EmailJS Connection Test';
        const testHtml = `
            <h1>EmailJS Test</h1>
            <p>This is a test email to verify EmailJS integration with Schedify.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
        `;

        console.log('📧 Sending test email...');
        
        const result = await sendEmailJSEmail(
            testEmail,
            null,
            testSubject,
            testHtml,
            'Test Department',
            'Test User',
            ['test_table_1', 'test_table_2'],
            'Test Week Range'
        );

        if (result.success) {
            console.log('✅ EmailJS connection test successful!');
            return true;
        } else {
            console.error('❌ EmailJS connection test failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ EmailJS connection test error:', error);
        return false;
    }
}

// Initialize EmailJS on module load
console.log('📧 EmailJS Initialized for Schedify');
console.log(`   Service: ${EMAILJS_SERVICE_ID}`);
console.log(`   User: ${EMAILJS_USER_ID}`);
>>>>>>> 4277c086c3fee7775fced2f303de6e665eb10e82

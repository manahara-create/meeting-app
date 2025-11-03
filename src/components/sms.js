// Background Process for Weekly Record Check - Schedify App
import { supabase } from "../services/supabase.js";
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';

// MailerSend Configuration
const MAILERSEND_SMTP_SERVER = 'smtp.mailersend.net';
const MAILERSEND_SMTP_PORT = 587;
const MAILERSEND_SMTP_USERNAME = 'MS_TldgFx@test-68zxl27qop34j905.mlsender.net';
const MAILERSEND_SMTP_PASSWORD = 'mssp.7BAOjvm.neqvygm3r98l0p7w.z0eMLns';
const MAILERSEND_FROM_EMAIL = 'schedifiy@gmail.com';
const MAILERSEND_FROM_NAME = 'Schedify - Powered by E-Healthcare Solutions';

// Create nodemailer transporter
const mailerSendTransporter = nodemailer.createTransport({
    host: MAILERSEND_SMTP_SERVER,
    port: MAILERSEND_SMTP_PORT,
    secure: false, // Use TLS
    auth: {
        user: MAILERSEND_SMTP_USERNAME,
        pass: MAILERSEND_SMTP_PASSWORD,
    },
});

// Test the transporter connection
async function testMailerSendConnection() {
    try {
        console.log('🔗 Testing MailerSend SMTP connection...');
        await mailerSendTransporter.verify();
        console.log('✅ MailerSend SMTP connection established successfully');
        return true;
    } catch (error) {
        console.error('❌ MailerSend SMTP connection failed:', error);
        return false;
    }
}

// Department configuration with responsible persons - UPDATED WITH VALID EMAILS
const departmentConfig = {
    'After Sales': { person: 'Not Confirmed Yet', email: 'mudusara@aipl.lk' }, // Default to admin
    'BDM': { person: 'Prasadi Nuwanthika', email: 'prasadi.nuwanthika@biomedica.lk' },
    'Cluster 1': { person: 'Imesha Nilakshi', email: 'imesha.nilakshi@aipl.lk' },
    'Cluster 2': { person: 'Pradheesha Jeromie', email: 'pradheesha.jeromie@biomedica.lk' },
    'Cluster 3': { person: 'Gayathri Silva', email: 'gayathri.silva@biomedica.lk' },
    'Cluster 4': { person: 'Imesha Nilakshi', email: 'imesha.nilakshi@aipl.lk' },
    'Cluster 5': { person: 'Pradheesha Jeromie', email: 'pradheesha.jeromie@biomedica.lk' },
    'Cluster 6': { person: 'Gayathri Silva', email: 'gayathri.silva@biomedica.lk' },
    'Customer Care': { person: 'Rashmika Premathilaka', email: 'rashmika.premathilaka@biomedica.lk' },
    'E-Healthcare': { person: 'Dhara Nethmi', email: 'dhara.nethmi@aipl.lk' },
    'Finance': { person: 'Not Confirmed Yet', email: 'mudusara@aipl.lk' }, // Default to admin
    'Hi-Tech': { person: 'Sahiru Chathuranga', email: 'sahiru.chathuranga@aipl.lk' },
    'HR': { person: 'Nethmini Koshila', email: 'nethmini.koshila@aipl.lk' },
    'Imports': { person: 'Subhashini Sandamalie', email: 'subhashini.sandamali@aipl.lk' },
    'IT': { person: 'Not Yet Confirmed', email: 'mudusara@aipl.lk' }, // Default to admin
    'Regulatory': { person: 'Thimathi Dissanayake', email: 'thimathi.dissanayake@aipl.lk' }, // UPDATED
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

// Function to diagnose department configuration for null/empty values
function diagnoseDepartmentConfig() {
    console.log('🔍 Diagnosing department configuration for null/empty values...');

    let issuesFound = 0;
    let validDepartments = 0;

    for (const [department, config] of Object.entries(departmentConfig)) {
        console.log(`\n📋 Checking ${department}:`);
        console.log(`   Person: "${config.person}"`);
        console.log(`   Email: "${config.email}"`);

        // Check for null/empty values
        if (!config.person || config.person.trim() === '') {
            console.log(`   ❌ ISSUE: Person name is empty or null`);
            issuesFound++;
        }

        if (!config.email || config.email.trim() === '') {
            console.log(`   ❌ ISSUE: Email is empty or null`);
            issuesFound++;
        } else {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(config.email.trim())) {
                console.log(`   ❌ ISSUE: Invalid email format: ${config.email}`);
                issuesFound++;
            } else {
                validDepartments++;
                console.log(`   ✅ Valid email configuration`);
            }
        }
    }

    console.log(`\n📊 DIAGNOSIS SUMMARY:`);
    console.log(`   Total Departments: ${Object.keys(departmentConfig).length}`);
    console.log(`   Valid Departments: ${validDepartments}`);
    console.log(`   Issues Found: ${issuesFound}`);

    if (issuesFound === 0) {
        console.log('🎉 No configuration issues found! All departments have valid email addresses.');
    } else {
        console.log('❌ Configuration issues detected! Please fix the above issues.');
    }

    return issuesFound === 0;
}

// Function to check if today is Monday
function isMonday() {
    const today = new Date();
    console.log(`📅 Today is: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    return today.getDay() === 1; // 0 = Sunday, 1 = Monday
}

// Function to check if current time is between 09:00 AM and 11:00 AM
function isBetweenNineToTenAM() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    console.log(`⏰ Current time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);

    // Check if time is between 09:00 (540 minutes) and 11:00 (660 minutes)
    return totalMinutes >= 540 && totalMinutes <= 660;
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

// Function to generate email HTML content
function generateEmailHTML(department, person, weekRange) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .button { background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Schedify Alert</h1>
            <p>Weekly Activity Monitoring System</p>
        </div>
        <div class="content">
            <h2>No Records Found - ${department}</h2>
            
            <div class="alert">
                <h3>⚠️ Attention Required</h3>
                <p>Dear <strong>${person}</strong>,</p>
                <p>Our monitoring system has detected that <strong>no activity records</strong> were found for the <strong>${department}</strong> department during the period:</p>
                <p style="text-align: center; font-size: 18px; font-weight: bold; color: #dc3545;">${weekRange}</p>
            </div>

            <h3>📊 What this means:</h3>
            <ul>
                <li>No meetings, visits, or activities were recorded in Schedify</li>
                <li>This could indicate missed data entry or lack of departmental activities</li>
                <li>Please ensure all departmental activities are properly recorded</li>
            </ul>

            <h3>🔧 Required Action:</h3>
            <ol>
                <li>Review departmental activities for the mentioned period</li>
                <li>Ensure all completed activities are recorded in Schedify</li>
                <li>Update any missing records promptly</li>
                <li>Contact your team members to verify activity completion</li>
            </ol>

            <div style="text-align: center; margin: 25px 0;">
                <a href="https://schedify.eHealthcare.lk" class="button">Access Schedify Now</a>
            </div>

            <p><strong>Note:</strong> This is an automated alert from the Schedify monitoring system. Please ensure regular updates to maintain accurate activity tracking.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Schedify - Powered by E-Healthcare Solutions</p>
            <p>This email was automatically generated. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Function to send email notification using MailerSend - ENHANCED WITH DEBUGGING
async function sendMailerSendEmail(to, cc, subject, htmlContent, department, person, weekRange) {
    try {
        console.log(`\n🔍 DEBUG: sendMailerSendEmail called with parameters:`);
        console.log(`   To: "${to}"`);
        console.log(`   CC: "${cc}"`);
        console.log(`   Department: "${department}"`);
        console.log(`   Person: "${person}"`);

        // Enhanced validation with detailed debugging
        if (!to) {
            console.error('❌ DEBUG: Recipient email is null/undefined');
            return { success: false, error: 'Recipient email is null/undefined' };
        }

        if (typeof to !== 'string') {
            console.error('❌ DEBUG: Recipient email is not a string:', typeof to);
            return { success: false, error: 'Recipient email is not a string' };
        }

        if (to.trim() === '') {
            console.error('❌ DEBUG: Recipient email is empty string');
            return { success: false, error: 'Recipient email is empty string' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const trimmedTo = to.trim();

        if (!emailRegex.test(trimmedTo)) {
            console.error(`❌ DEBUG: Invalid recipient email format: "${to}"`);
            return { success: false, error: `Invalid recipient email format: "${to}"` };
        }

        console.log(`✅ DEBUG: Email validation passed for recipient: ${trimmedTo}`);

        // Prepare mail options
        const mailOptions = {
            from: {
                name: MAILERSEND_FROM_NAME,
                address: MAILERSEND_FROM_EMAIL
            },
            to: trimmedTo,
            cc: cc && cc.trim() !== '' ? cc.trim() : undefined,
            subject: subject,
            html: htmlContent,
            replyTo: 'noreply@schedify.eHealthcare.lk'
        };

        console.log('📨 DEBUG: Final mail options for MailerSend:');
        console.log(JSON.stringify(mailOptions, null, 2));

        // Send email using MailerSend SMTP
        const result = await mailerSendTransporter.sendMail(mailOptions);
        
        console.log('✅ MailerSend email sent successfully');
        console.log('📧 MailerSend response:', result);
        
        return { success: true, result: result };
    } catch (error) {
        console.error('❌ MailerSend email sending failed:', error);
        return { success: false, error: error.message };
    }
}

// Function to send department notification - ENHANCED WITH DEBUGGING
async function sendDepartmentNotification(department, weekRange) {
    console.log(`\n🔍 DEBUG: Starting notification for ${department}`);

    const deptConfig = departmentConfig[department];

    if (!deptConfig) {
        console.error(`❌ DEBUG: No configuration found for department: ${department}`);
        return false;
    }

    console.log(`🔍 DEBUG: Department config found:`, deptConfig);

    // Enhanced validation for department configuration
    if (!deptConfig.email) {
        console.error(`❌ DEBUG: No email configured for department: ${department}`);
        return false;
    }

    if (typeof deptConfig.email !== 'string') {
        console.error(`❌ DEBUG: Email is not a string for department ${department}:`, typeof deptConfig.email);
        return false;
    }

    if (deptConfig.email.trim() === '') {
        console.error(`❌ DEBUG: Empty email string for department: ${department}`);
        return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = deptConfig.email.trim();

    if (!emailRegex.test(trimmedEmail)) {
        console.error(`❌ DEBUG: Invalid email format for ${department}: "${deptConfig.email}"`);
        return false;
    }

    console.log(`✅ DEBUG: Email validation passed for ${department}: ${trimmedEmail}`);

    const subject = `🚨 Schedify Alert - No Records Found - ${department} - Week ${weekRange}`;
    const htmlContent = generateEmailHTML(department, deptConfig.person, weekRange);

    try {
        console.log(`📧 DEBUG: Preparing to send email for ${department} to ${trimmedEmail}`);

        const result = await sendMailerSendEmail(
            trimmedEmail,
            DEFAULT_CC_EMAIL,
            subject,
            htmlContent,
            department,
            deptConfig.person,
            weekRange
        );

        if (result.success) {
            console.log(`✅ Email sent successfully for ${department}`);
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

    // Test MailerSend connection first
    console.log('\n🔗 Testing MailerSend connection...');
    const connectionTest = await testMailerSendConnection();
    if (!connectionTest) {
        console.error('❌ MailerSend connection failed. Aborting weekly check.');
        return {
            status: 'error',
            reason: 'MailerSend connection failed',
            timestamp: new Date().toISOString()
        };
    }

    // Run diagnosis
    console.log('\n🔍 Running configuration diagnosis...');
    const configValid = diagnoseDepartmentConfig();

    if (!configValid) {
        console.error('❌ Configuration issues detected. Aborting weekly check.');
        return {
            status: 'error',
            reason: 'Invalid department configuration',
            timestamp: new Date().toISOString()
        };
    }

    // Check if today is Monday
    if (!isMonday()) {
        console.log('❌ Today is not Monday. Weekly check aborted.');
        return {
            status: 'skipped',
            reason: 'Not Monday',
            timestamp: new Date().toISOString()
        };
    }

    // Check if it's between 09:00 AM and 11:00 AM
    if (!isBetweenNineToTenAM()) {
        console.log('❌ Current time is not between 09:00 AM and 11:00 AM. Weekly check aborted.');
        return {
            status: 'skipped',
            reason: 'Not between 09:00 AM and 11:00 AM',
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

    console.log('✅ Conditions met: Monday, between 09:00-11:00 AM, no email sent this week');

    const { dateRange } = getLast5DaysRange();
    console.log(`📆 Checking last 5 days: ${dateRange}`);

    let departmentsNotified = 0;
    let totalDepartmentsChecked = 0;

    // Check each department
    for (const [department, deptConfig] of Object.entries(departmentConfig)) {
        // Skip departments without valid email configuration
        if (!deptConfig.email || deptConfig.email.trim() === '') {
            console.log(`⏭️ Skipping ${department} - No valid email configured`);
            continue;
        }

        // Validate email format before proceeding
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(deptConfig.email.trim())) {
            console.log(`⏭️ Skipping ${department} - Invalid email format: ${deptConfig.email}`);
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

// Scheduler that runs every minute to check if it's Monday between 09:00-11:00 AM
export function scheduleWeeklyCheck() {
    console.log('⏰ Schedify - Starting weekly check scheduler...');

    // Check every minute
    setInterval(async () => {
        const now = new Date();
        const isMondayToday = now.getDay() === 1;
        const isBetweenNineToElevenAMNow = (now.getHours() === 9) || (now.getHours() === 10) || (now.getHours() === 11 && now.getMinutes() === 0);

        console.log(`⏰ Scheduler check - Monday: ${isMondayToday}, 09:00-11:00: ${isBetweenNineToElevenAMNow}`);

        if (isMondayToday && isBetweenNineToElevenAMNow) {
            console.log('🎯 Scheduler triggered - Monday between 09:00-11:00 AM detected');
            try {
                await performWeeklyRecordCheck();
            } catch (error) {
                console.error('❌ Error in scheduled weekly check:', error);
            }
        }
    }, 60 * 1000); // Check every minute

    console.log('✅ Weekly check scheduler started - Checking every minute for Monday between 09:00-11:00 AM');
}

// Manual trigger for testing (bypasses day/time checks)
export async function manualTrigger() {
    console.log('🔧 Schedify - Manual trigger activated (bypassing day/time checks)');

    // Test MailerSend connection first
    console.log('\n🔗 Testing MailerSend connection...');
    const connectionTest = await testMailerSendConnection();
    if (!connectionTest) {
        console.error('❌ MailerSend connection failed. Aborting manual check.');
        return {
            status: 'error',
            reason: 'MailerSend connection failed',
            timestamp: new Date().toISOString()
        };
    }

    // Run diagnosis
    console.log('\n🔍 Running configuration diagnosis...');
    diagnoseDepartmentConfig();

    // Bypass the Monday and time checks for manual testing
    console.log('🚀 Bypassing day/time checks for manual testing');

    const { dateRange } = getLast5DaysRange();
    console.log(`📆 Checking last 5 days: ${dateRange}`);

    let departmentsNotified = 0;
    let totalDepartmentsChecked = 0;

    // Check each department
    for (const [department, deptConfig] of Object.entries(departmentConfig)) {
        // Skip departments without valid email configuration
        if (!deptConfig.email || deptConfig.email.trim() === '') {
            console.log(`⏭️ Skipping ${department} - No valid email configured`);
            continue;
        }

        // Validate email format before proceeding
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(deptConfig.email.trim())) {
            console.log(`⏭️ Skipping ${department} - Invalid email format: ${deptConfig.email}`);
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
console.log(`   Email Provider: MailerSend`);
console.log(`   SMTP Server: ${MAILERSEND_SMTP_SERVER}`);
console.log(`   From Email: ${MAILERSEND_FROM_EMAIL}`);
console.log(`   Departments: ${Object.keys(departmentConfig).length}`);
console.log(`   Tables: ${Object.keys(tableConfig).length}`);

// Test MailerSend connection on startup
testMailerSendConnection();

// Run diagnosis on startup
diagnoseDepartmentConfig();

// Start the scheduler automatically
scheduleWeeklyCheck();
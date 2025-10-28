import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Button, Row, Col, Typography, Table, DatePicker,
    Space, Tag, Statistic, Alert, Spin, Modal, Form, Input,
    Select, InputNumber, message, Popconfirm, Divider, List,
    Tooltip, Badge, Timeline, Empty, Result, Descriptions,
    Tabs, Switch, Pagination, Progress, Rate, TimePicker, Radio, Dropdown, Upload
} from 'antd';
import {
    TeamOutlined, CalendarOutlined, CheckCircleOutlined,
    UserOutlined, FilterOutlined, PlusOutlined,
    EditOutlined, DeleteOutlined, ScheduleOutlined,
    ExclamationCircleOutlined, ReloadOutlined, WarningOutlined,
    MessageOutlined, WechatOutlined, SendOutlined,
    CloseOutlined, EyeOutlined, SyncOutlined, ClockCircleOutlined,
    InfoCircleOutlined, SafetyCertificateOutlined, BarChartOutlined,
    StarOutlined, FlagOutlined, FileExcelOutlined, GlobalOutlined,
    AppstoreOutlined, BarsOutlined, DownloadOutlined, FileWordOutlined,
    UploadOutlined, FileAddOutlined, BookOutlined, TrophyOutlined
} from '@ant-design/icons';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { notifyDepartmentOperation, NOTIFICATION_TYPES } from '../../services/notifications';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table as DocTable, TableRow, TableCell, WidthType } from 'docx';

// Extend dayjs with plugins
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
    <Result
        status="error"
        title="Something went wrong in HR Module"
        subTitle={error?.message || "An unexpected error occurred"}
        extra={
            <Button type="primary" onClick={resetErrorBoundary} size="large">
                Try Again
            </Button>
        }
    />
);

// Loading component
const LoadingSpinner = ({ tip = "Loading HR data..." }) => (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip={tip} />
    </div>
);

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 1:
                return { color: 'green', text: 'Low', icon: <FlagOutlined /> };
            case 2:
                return { color: 'blue', text: 'Normal', icon: <FlagOutlined /> };
            case 3:
                return { color: 'orange', text: 'Medium', icon: <FlagOutlined /> };
            case 4:
                return { color: 'red', text: 'High', icon: <FlagOutlined /> };
            case 5:
                return { color: 'purple', text: 'Critical', icon: <FlagOutlined /> };
            default:
                return { color: 'default', text: 'Normal', icon: <FlagOutlined /> };
        }
    };

    const config = getPriorityConfig(priority);

    return (
        <Badge
            count={
                <Tag color={config.color} icon={config.icon} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {config.text}
                </Tag>
            }
        />
    );
};

// Statistics Cards Component
const HRStatistics = ({ stats, loading = false }) => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Total Records"
                    value={stats?.totalRecords || 0}
                    prefix={<TeamOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Meetings"
                    value={stats?.meetingsCount || 0}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Training Programs"
                    value={stats?.trainingCount || 0}
                    prefix={<BookOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
            </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center' }} loading={loading}>
                <Statistic
                    title="Special Tasks"
                    value={stats?.specialTasksCount || 0}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: '20px' }}
                />
            </Card>
        </Col>
    </Row>
);

// Category Card Component
const CategoryCard = ({ category, isSelected, onClick, loading = false }) => (
    <Card
        hoverable
        loading={loading}
        style={{
            height: '120px',
            border: `2px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            backgroundColor: isSelected ? '#e6f7ff' : '#fff'
        }}
        bodyStyle={{
            padding: '16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
        }}
        onClick={onClick}
    >
        <div style={{
            fontSize: '32px',
            color: isSelected ? '#1890ff' : '#666',
            marginBottom: '8px'
        }}>
            {category.icon}
        </div>
        <Title level={5} style={{ margin: 0, color: isSelected ? '#1890ff' : '#000' }}>
            {category.name}
        </Title>
        <Text type="secondary" style={{ fontSize: '12px' }}>
            {category.type}
        </Text>
    </Card>
);

// Bulk Form Fields Component
const BulkFormFields = ({ records, onChange, category, priorityOptions, safeDayjs, allProfiles }) => {
    const updateRecord = (index, field, value) => {
        const newRecords = [...records];
        newRecords[index] = {
            ...newRecords[index],
            [field]: value
        };
        onChange(newRecords);
    };

    const addRecord = () => {
        onChange([...records, {}]);
    };

    const removeRecord = (index) => {
        if (records.length > 1) {
            const newRecords = records.filter((_, i) => i !== index);
            onChange(newRecords);
        }
    };

    const renderCommonFields = (record, index) => (
        <>
            <Form.Item
                label="Priority"
                required
            >
                <Select
                    value={record.priority || 2}
                    onChange={(value) => updateRecord(index, 'priority', value)}
                    placeholder="Select priority"
                >
                    {priorityOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                            <Space>
                                <Badge color={option.color} />
                                {option.label}
                            </Space>
                        </Option>
                    ))}
                </Select>
            </Form.Item>
        </>
    );

    const renderCategorySpecificFields = (record, index) => {
        switch (category?.id) {
            case 'meetings':
                return (
                    <>
                        <Form.Item
                            label="Meeting Date"
                            required
                        >
                            <DatePicker
                                value={record.date ? safeDayjs(record.date) : null}
                                onChange={(date) => updateRecord(index, 'date', date)}
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Select meeting date"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Start Time"
                        >
                            <TimePicker
                                value={record.start_time ? safeDayjs(record.start_time, 'HH:mm') : null}
                                onChange={(time) => updateRecord(index, 'start_time', time)}
                                style={{ width: '100%' }}
                                format="HH:mm"
                                placeholder="Select start time"
                            />
                        </Form.Item>
                        <Form.Item
                            label="End Time"
                        >
                            <TimePicker
                                value={record.end_time ? safeDayjs(record.end_time, 'HH:mm') : null}
                                onChange={(time) => updateRecord(index, 'end_time', time)}
                                style={{ width: '100%' }}
                                format="HH:mm"
                                placeholder="Select end time"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Subject"
                            required
                        >
                            <TextArea
                                rows={2}
                                value={record.subject || ''}
                                onChange={(e) => updateRecord(index, 'subject', e.target.value)}
                                placeholder="Enter meeting subject"
                            />
                        </Form.Item>
                    </>
                );

            case 'training':
                return (
                    <>
                        <Form.Item
                            label="Training Date"
                            required
                        >
                            <DatePicker
                                value={record.date ? safeDayjs(record.date) : null}
                                onChange={(date) => updateRecord(index, 'date', date)}
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Select training date"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Start Time"
                        >
                            <TimePicker
                                value={record.start_time ? safeDayjs(record.start_time, 'HH:mm') : null}
                                onChange={(time) => updateRecord(index, 'start_time', time)}
                                style={{ width: '100%' }}
                                format="HH:mm"
                                placeholder="Select start time"
                            />
                        </Form.Item>
                        <Form.Item
                            label="End Time"
                        >
                            <TimePicker
                                value={record.end_time ? safeDayjs(record.end_time, 'HH:mm') : null}
                                onChange={(time) => updateRecord(index, 'end_time', time)}
                                style={{ width: '100%' }}
                                format="HH:mm"
                                placeholder="Select end time"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Department"
                        >
                            <Input
                                value={record.department || ''}
                                onChange={(e) => updateRecord(index, 'department', e.target.value)}
                                placeholder="Enter department"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Training Program"
                            required
                        >
                            <TextArea
                                rows={2}
                                value={record.training_program || ''}
                                onChange={(e) => updateRecord(index, 'training_program', e.target.value)}
                                placeholder="Enter training program"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Trainer Names"
                        >
                            <Select
                                mode="tags"
                                value={Array.isArray(record.trainer_names) ? record.trainer_names : []}
                                onChange={(value) => updateRecord(index, 'trainer_names', value)}
                                placeholder="Enter trainer names (press Enter to add multiple)"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Status"
                        >
                            <Input
                                value={record.status || ''}
                                onChange={(e) => updateRecord(index, 'status', e.target.value)}
                                placeholder="Enter status"
                            />
                        </Form.Item>
                    </>
                );

            case 'special_events_n_tasks':
                return (
                    <>
                        <Form.Item
                            label="Date"
                            required
                        >
                            <DatePicker
                                value={record.date ? safeDayjs(record.date) : null}
                                onChange={(date) => updateRecord(index, 'date', date)}
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Select date"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Task"
                            required
                        >
                            <TextArea
                                rows={2}
                                value={record.task || ''}
                                onChange={(e) => updateRecord(index, 'task', e.target.value)}
                                placeholder="Enter task"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Status"
                        >
                            <Input
                                value={record.status || ''}
                                onChange={(e) => updateRecord(index, 'status', e.target.value)}
                                placeholder="Enter status"
                            />
                        </Form.Item>
                        <Form.Item
                            label="Date Range (days)"
                        >
                            <InputNumber
                                value={record.date_range || ''}
                                onChange={(value) => updateRecord(index, 'date_range', value)}
                                style={{ width: '100%' }}
                                placeholder="Enter date range in days"
                                min={1}
                            />
                        </Form.Item>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {records.map((record, index) => (
                <Card
                    key={index}
                    title={`Record ${index + 1}`}
                    size="small"
                    style={{ marginBottom: 16, border: '1px solid #d9d9d9' }}
                    extra={
                        records.length > 1 && (
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeRecord(index)}
                                size="small"
                            >
                                Remove
                            </Button>
                        )
                    }
                >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {renderCommonFields(record, index)}
                        {renderCategorySpecificFields(record, index)}
                    </Space>
                </Card>
            ))}

            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addRecord}
                style={{ width: '100%' }}
            >
                Add Another Record
            </Button>

            <Alert
                message={`You are creating ${records.length} record(s) at once`}
                description="All records will be saved when you click the 'Create Records' button."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
            />
        </div>
    );
};

// Excel Import Modal Component
const ExcelImportModal = ({ visible, onCancel, selectedCategory, onImportComplete, allProfiles }) => {
    const [importLoading, setImportLoading] = useState(false);
    const [uploadedData, setUploadedData] = useState([]);
    const [validationResults, setValidationResults] = useState([]);

    // Check if category has responsible_bdm_ids field
    const hasResponsibleBDMField = selectedCategory?.hasResponsibleBDM || false;

    // Download template function
    const downloadTemplate = () => {
        try {
            if (hasResponsibleBDMField) {
                // Show warning for categories with responsible_bdm_ids
                Modal.warning({
                    title: 'Template Not Available',
                    content: (
                        <div>
                            <p><strong>We cannot create a template for this category.</strong></p>
                            <p>This category has a mandatory column "Responsible BDM" for assigning employees.</p>
                            <p>Please use the "Bulk Records" feature to add multiple records with proper employee assignments.</p>
                        </div>
                    ),
                    okText: 'Understood'
                });
                return;
            }

            // Create template data structure based on category
            let templateData = [];
            let headers = [];

            switch (selectedCategory?.id) {
                case 'meetings':
                    headers = ['Date*', 'Start Time', 'End Time', 'Subject*', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Start Time': '09:00',
                        'End Time': '10:00',
                        'Subject*': 'Team Meeting',
                        'Priority*': '3'
                    }];
                    break;

                case 'training':
                    headers = ['Date*', 'Start Time', 'End Time', 'Department', 'Training Program*', 'Trainer Names', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Start Time': '09:00',
                        'End Time': '17:00',
                        'Department': 'HR',
                        'Training Program*': 'Leadership Training',
                        'Trainer Names': 'John Doe, Jane Smith',
                        'Status': 'Scheduled',
                        'Priority*': '2'
                    }];
                    break;

                case 'special_events_n_tasks':
                    headers = ['Date*', 'Task*', 'Status', 'Date Range', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Task*': 'Annual Review',
                        'Status': 'In Progress',
                        'Date Range': '5',
                        'Priority*': '3'
                    }];
                    break;

                default:
                    headers = ['Date*', 'Status', 'Priority*'];
                    templateData = [{
                        'Date*': '15/01/2024',
                        'Status': 'Active',
                        'Priority*': '2'
                    }];
            }

            // Add instructions row
            const instructions = {
                'Instructions': 'Fill in the data below. Fields marked with * are required.',
                'Priority Guide': '1=Low, 2=Normal, 3=Medium, 4=High, 5=Critical',
                'Date Format': 'DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD',
                'Time Format': 'HH:mm (e.g., 09:00)'
            };

            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();

            // Add instructions sheet
            const instructionSheet = XLSX.utils.json_to_sheet([instructions]);
            XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

            // Add data template sheet
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

            // Auto-size columns
            const colWidths = headers.map(header => ({ wch: Math.max(header.length + 2, 15) }));
            worksheet['!cols'] = colWidths;

            const fileName = `${selectedCategory?.name || 'hr'}_import_template.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success('Template downloaded successfully!');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Failed to download template');
        }
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const cleanDateStr = dateStr.toString().trim();
        
        // Try dd/mm/yyyy format first
        let date = dayjs(cleanDateStr, 'DD/MM/YYYY', true);
        if (date.isValid()) return date;
        
        // Try yyyy-mm-dd format
        date = dayjs(cleanDateStr, 'YYYY-MM-DD', true);
        if (date.isValid()) return date;
        
        // Try other common formats
        date = dayjs(cleanDateStr);
        return date.isValid() ? date : null;
    };

    const parseTime = (timeStr) => {
        if (!timeStr) return null;
        const cleanTimeStr = timeStr.toString().trim();
        
        // Try HH:mm format
        let time = dayjs(cleanTimeStr, 'HH:mm', true);
        if (time.isValid()) return time.format('HH:mm:ss');
        
        // Try HH:mm:ss format
        time = dayjs(cleanTimeStr, 'HH:mm:ss', true);
        if (time.isValid()) return time.format('HH:mm:ss');
        
        return null;
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (hasResponsibleBDMField) {
            toast.warning('Excel import is not available for categories with Responsible BDM field. Use Bulk Records instead.');
            return false;
        }

        setImportLoading(true);
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first worksheet
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast.error('The uploaded file is empty');
                    setImportLoading(false);
                    return;
                }

                // Validate data
                const validatedData = validateExcelData(jsonData);
                setUploadedData(validatedData.validRows);
                setValidationResults(validatedData.results);

                if (validatedData.validRows.length === 0) {
                    toast.error('No valid data found in the uploaded file');
                } else {
                    toast.success(`Found ${validatedData.validRows.length} valid records out of ${jsonData.length}`);
                }
            } catch (error) {
                console.error('Error reading Excel file:', error);
                toast.error('Failed to read Excel file');
            } finally {
                setImportLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
        return false; // Prevent default upload behavior
    };

    // Validate Excel data
    const validateExcelData = (data) => {
        const results = [];
        const validRows = [];

        data.forEach((row, index) => {
            const errors = [];
            const validatedRow = {};

            // Check required fields based on category
            switch (selectedCategory?.id) {
                case 'meetings':
                    if (!row['Date*'] && !row.Date) {
                        errors.push('Date is required');
                    } else {
                        const date = parseDate(row['Date*'] || row.Date);
                        if (!date || !date.isValid()) {
                            errors.push('Invalid Date format. Use DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD');
                        } else {
                            validatedRow.date = date.format('YYYY-MM-DD');
                        }
                    }
                    if (!row['Subject*'] && !row.Subject) errors.push('Subject is required');
                    else validatedRow.subject = row['Subject*'] || row.Subject;

                    if (row['Start Time'] || row['Start Time*']) {
                        const time = parseTime(row['Start Time'] || row['Start Time*']);
                        if (time) validatedRow.start_time = time;
                    }
                    if (row['End Time'] || row['End Time*']) {
                        const time = parseTime(row['End Time'] || row['End Time*']);
                        if (time) validatedRow.end_time = time;
                    }
                    break;

                case 'training':
                    if (!row['Date*'] && !row.Date) {
                        errors.push('Date is required');
                    } else {
                        const date = parseDate(row['Date*'] || row.Date);
                        if (!date || !date.isValid()) {
                            errors.push('Invalid Date format. Use DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD');
                        } else {
                            validatedRow.date = date.format('YYYY-MM-DD');
                        }
                    }
                    if (!row['Training Program*'] && !row['Training Program']) errors.push('Training Program is required');
                    else validatedRow.training_program = row['Training Program*'] || row['Training Program'];

                    if (row['Start Time'] || row['Start Time*']) {
                        const time = parseTime(row['Start Time'] || row['Start Time*']);
                        if (time) validatedRow.start_time = time;
                    }
                    if (row['End Time'] || row['End Time*']) {
                        const time = parseTime(row['End Time'] || row['End Time*']);
                        if (time) validatedRow.end_time = time;
                    }

                    validatedRow.department = row.Department || '';
                    validatedRow.status = row.Status || 'Scheduled';
                    
                    if (row['Trainer Names']) {
                        validatedRow.trainer_names = Array.isArray(row['Trainer Names']) 
                            ? row['Trainer Names'] 
                            : row['Trainer Names'].split(',').map(name => name.trim());
                    }
                    break;

                case 'special_events_n_tasks':
                    if (!row['Date*'] && !row.Date) {
                        errors.push('Date is required');
                    } else {
                        const date = parseDate(row['Date*'] || row.Date);
                        if (!date || !date.isValid()) {
                            errors.push('Invalid Date format. Use DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD');
                        } else {
                            validatedRow.date = date.format('YYYY-MM-DD');
                        }
                    }
                    if (!row['Task*'] && !row.Task) errors.push('Task is required');
                    else validatedRow.task = row['Task*'] || row.Task;

                    validatedRow.status = row.Status || 'Active';
                    validatedRow.date_range = row['Date Range'] || null;
                    break;
            }

            // Priority validation
            if (!row.Priority && !row['Priority*']) {
                errors.push('Priority is required');
            } else {
                const priority = parseInt(row.Priority || row['Priority*']);
                if (isNaN(priority) || priority < 1 || priority > 5) {
                    errors.push('Priority must be between 1-5');
                } else {
                    validatedRow.priority = priority;
                }
            }

            results.push({
                row: index + 2, // +2 because Excel rows start at 1 and we have header
                data: validatedRow,
                errors,
                isValid: errors.length === 0
            });

            if (errors.length === 0) {
                validRows.push(validatedRow);
            }
        });

        return { results, validRows };
    };

    // Import validated data
    const importData = async () => {
        if (uploadedData.length === 0) {
            toast.warning('No valid data to import');
            return;
        }

        setImportLoading(true);
        try {
            const { data, error } = await supabase
                .from(selectedCategory.table)
                .insert(uploadedData)
                .select();

            if (error) throw error;

            // Send notifications for each imported record
            for (const record of data) {
                await notifyDepartmentOperation(
                    'hr',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    record,
                    {
                        tableName: selectedCategory.table,
                        userId: 'excel-import',
                        source: 'excel_import'
                    }
                );
            }

            toast.success(`Successfully imported ${data.length} records`);
            onImportComplete();
            onCancel();
        } catch (error) {
            console.error('Error importing data:', error);
            toast.error('Failed to import data');
        } finally {
            setImportLoading(false);
        }
    };

    const uploadProps = {
        beforeUpload: handleFileUpload,
        accept: '.xlsx, .xls',
        showUploadList: false,
        multiple: false
    };

    return (
        <Modal
            title={
                <Space>
                    <FileExcelOutlined />
                    Import Data from Excel - {selectedCategory?.name}
                </Space>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button
                    key="download"
                    icon={<DownloadOutlined />}
                    onClick={downloadTemplate}
                    disabled={hasResponsibleBDMField}
                >
                    Download Template
                </Button>,
                <Button
                    key="import"
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={importData}
                    loading={importLoading}
                    disabled={uploadedData.length === 0 || hasResponsibleBDMField}
                >
                    Import {uploadedData.length} Records
                </Button>
            ]}
            width={800}
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Warning Alert for categories with responsible_bdm_ids */}
                {hasResponsibleBDMField && (
                    <Alert
                        message="Excel Import Not Available"
                        description={
                            <div>
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    We cannot create a template for this category, because there is a mandatory column "Responsible BDM" for assigning employees.
                                </Text>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                    <li>Use the "Bulk Records" feature to add multiple records with proper employee assignments</li>
                                    <li>Responsible BDM assignments must be done manually in the system</li>
                                    <li>This ensures proper tracking and accountability</li>
                                </ul>
                            </div>
                        }
                        type="warning"
                        showIcon
                    />
                )}

                {/* Upload Section */}
                {!hasResponsibleBDMField && (
                    <>
                        <Card size="small" title="Upload Excel File">
                            <Upload.Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <FileExcelOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    Click or drag Excel file to this area to upload
                                </p>
                                <p className="ant-upload-hint">
                                    Support for .xlsx, .xls files only
                                </p>
                            </Upload.Dragger>
                        </Card>

                        {/* Validation Results */}
                        {validationResults.length > 0 && (
                            <Card
                                size="small"
                                title={`Validation Results (${uploadedData.length} valid / ${validationResults.length} total)`}
                            >
                                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                                    {validationResults.map((result, index) => (
                                        <Alert
                                            key={index}
                                            message={`Row ${result.row}: ${result.isValid ? 'Valid' : 'Has Errors'}`}
                                            description={
                                                result.errors.length > 0 ? (
                                                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                                        {result.errors.map((error, errorIndex) => (
                                                            <li key={errorIndex}>{error}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    'All fields are valid'
                                                )
                                            }
                                            type={result.isValid ? 'success' : 'error'}
                                            showIcon
                                            style={{ marginBottom: 8 }}
                                            size="small"
                                        />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Instructions */}
                        <Alert
                            message="Import Instructions"
                            description={
                                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                    <li>Download the template first to ensure correct format</li>
                                    <li>Required fields are marked with * in the template</li>
                                    <li>
                                        <Text strong>Date format: DD/MM/YYYY (e.g., 15/01/2024) or YYYY-MM-DD</Text>
                                    </li>
                                    <li>
                                        <Text strong>Time format: HH:mm (e.g., 09:00) or HH:mm:ss</Text>
                                    </li>
                                    <li>Priority must be a number between 1-5 (1=Low, 5=Critical)</li>
                                    <li>Only valid records will be imported</li>
                                </ul>
                            }
                            type="info"
                            showIcon
                        />
                    </>
                )}
            </Space>
        </Modal>
    );
};

// Export Button Component - Updated to remove PDF and add Word export
const ExportButton = ({ 
    activities = [], 
    selectedCategory = null,
    moduleName = '',
    priorityLabels = {},
    allProfiles = []
}) => {
    const priorityOptions = [
        { value: 1, label: 'Low', color: 'green' },
        { value: 2, label: 'Normal', color: 'blue' },
        { value: 3, label: 'Medium', color: 'orange' },
        { value: 4, label: 'High', color: 'red' },
        { value: 5, label: 'Critical', color: 'purple' }
    ];

    const getPriorityLabel = (priority) => {
        const option = priorityOptions.find(opt => opt.value === priority);
        return option ? option.label : 'Normal';
    };

    const formatTime = (time) => {
        try {
            if (!time) return '';
            return dayjs(time, 'HH:mm:ss').format('HH:mm');
        } catch (error) {
            return time || '';
        }
    };

    /** -----------------------------
     * Export to Excel (.xlsx)
     * ----------------------------- */
    const exportToExcel = () => {
        try {
            const dataForExport = activities.map(activity => {
                // Common structure for HR modules
                const base = {
                    'Category': selectedCategory?.name || '',
                    'Priority': getPriorityLabel(activity.priority),
                    'Date': activity.date
                        ? dayjs(activity.date).format('YYYY-MM-DD')
                        : '',
                    'Created Date': activity.created_at
                        ? dayjs(activity.created_at).format('YYYY-MM-DD')
                        : ''
                };

                // Extend base based on table type
                switch (selectedCategory?.id) {
                    case 'meetings':
                        return {
                            ...base,
                            'Subject': activity.subject || '',
                            'Start Time': formatTime(activity.start_time),
                            'End Time': formatTime(activity.end_time)
                        };

                    case 'training':
                        return {
                            ...base,
                            'Training Program': activity.training_program || '',
                            'Department': activity.department || '',
                            'Start Time': formatTime(activity.start_time),
                            'End Time': formatTime(activity.end_time),
                            'Status': activity.status || '',
                            'Trainer Names': Array.isArray(activity.trainer_names) ? activity.trainer_names.join(', ') : activity.trainer_names || ''
                        };

                    case 'special_events_n_tasks':
                        return {
                            ...base,
                            'Task': activity.task || '',
                            'Status': activity.status || '',
                            'Date Range': activity.date_range || ''
                        };

                    default:
                        return base;
                }
            });

            const worksheet = XLSX.utils.json_to_sheet(dataForExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Export');

            // Auto-size columns
            const colWidths = [];
            if (dataForExport.length > 0) {
                Object.keys(dataForExport[0]).forEach(key => {
                    const maxLength = Math.max(
                        key.length,
                        ...dataForExport.map(row => String(row[key] || '').length)
                    );
                    colWidths.push({ wch: Math.min(maxLength + 2, 50) });
                });
                worksheet['!cols'] = colWidths;
            }

            const fileName = `${selectedCategory?.name || 'hr_export'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            toast.success(`Excel file exported successfully! (${dataForExport.length} records)`);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.error('Failed to export Excel file');
        }
    };

    /** -----------------------------
     * Export to Word (.docx)
     * ----------------------------- */
    const exportToWord = async () => {
        try {
            // Create table rows for Word document
            const tableRows = activities.map((activity, index) => {
                const cells = [];

                // Add basic information cells based on category
                switch (selectedCategory?.id) {
                    case 'meetings':
                        cells.push(
                            new TableCell({ children: [new Paragraph(activity.subject || '')] }),
                            new TableCell({ children: [new Paragraph(activity.date ? dayjs(activity.date).format('DD/MM/YYYY') : '')] }),
                            new TableCell({ children: [new Paragraph(formatTime(activity.start_time))] }),
                            new TableCell({ children: [new Paragraph(formatTime(activity.end_time))] }),
                            new TableCell({ children: [new Paragraph(getPriorityLabel(activity.priority))] })
                        );
                        break;

                    case 'training':
                        cells.push(
                            new TableCell({ children: [new Paragraph(activity.training_program || '')] }),
                            new TableCell({ children: [new Paragraph(activity.department || '')] }),
                            new TableCell({ children: [new Paragraph(activity.date ? dayjs(activity.date).format('DD/MM/YYYY') : '')] }),
                            new TableCell({ children: [new Paragraph(formatTime(activity.start_time))] }),
                            new TableCell({ children: [new Paragraph(formatTime(activity.end_time))] }),
                            new TableCell({ children: [new Paragraph(getPriorityLabel(activity.priority))] })
                        );
                        break;

                    case 'special_events_n_tasks':
                        cells.push(
                            new TableCell({ children: [new Paragraph(activity.task || '')] }),
                            new TableCell({ children: [new Paragraph(activity.date ? dayjs(activity.date).format('DD/MM/YYYY') : '')] }),
                            new TableCell({ children: [new Paragraph(activity.status || '')] }),
                            new TableCell({ children: [new Paragraph(activity.date_range ? `${activity.date_range} days` : '')] }),
                            new TableCell({ children: [new Paragraph(getPriorityLabel(activity.priority))] })
                        );
                        break;

                    default:
                        cells.push(
                            new TableCell({ children: [new Paragraph(activity.date ? dayjs(activity.date).format('DD/MM/YYYY') : '')] }),
                            new TableCell({ children: [new Paragraph(getPriorityLabel(activity.priority))] })
                        );
                }

                return new TableRow({ children: cells });
            });

            // Create headers based on category
            let headers = [];
            switch (selectedCategory?.id) {
                case 'meetings':
                    headers = ['Subject', 'Date', 'Start Time', 'End Time', 'Priority'];
                    break;
                case 'training':
                    headers = ['Training Program', 'Department', 'Date', 'Start Time', 'End Time', 'Priority'];
                    break;
                case 'special_events_n_tasks':
                    headers = ['Task', 'Date', 'Status', 'Date Range', 'Priority'];
                    break;
                default:
                    headers = ['Date', 'Priority'];
            }

            const headerRow = new TableRow({
                children: headers.map(header => 
                    new TableCell({ 
                        children: [new Paragraph({ 
                            children: [new TextRun({ text: header, bold: true })] 
                        })] 
                    })
                )
            });

            const table = new DocTable({
                width: {
                    size: 100,
                    type: WidthType.PERCENTAGE,
                },
                rows: [headerRow, ...tableRows],
            });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${selectedCategory?.name || 'HR'} Export - ${dayjs().format('DD/MM/YYYY')}`,
                                    bold: true,
                                    size: 28,
                                }),
                            ],
                        }),
                        new Paragraph({ text: "" }), // Empty line
                        table,
                        new Paragraph({ text: "" }), // Empty line
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Total Records: ${activities.length}`,
                                    italics: true,
                                }),
                            ],
                        }),
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedCategory?.name || 'hr_export'}_${dayjs().format('YYYY-MM-DD')}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Word document exported successfully!');
        } catch (error) {
            console.error('Error exporting Word document:', error);
            toast.error('Failed to export Word document');
        }
    };

    /** -----------------------------
     * Dropdown menu
     * ----------------------------- */
    const exportItems = [
        { 
            key: 'excel', 
            icon: <FileExcelOutlined />, 
            label: 'Export to Excel', 
            onClick: exportToExcel 
        },
        { 
            key: 'word', 
            icon: <FileWordOutlined />, 
            label: 'Export to Word', 
            onClick: exportToWord 
        }
    ];

    return (
        <Dropdown 
            menu={{ items: exportItems }} 
            placement="bottomRight"
            disabled={activities.length === 0}
        >
            <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                size="large"
                disabled={activities.length === 0}
            >
                Export
            </Button>
        </Dropdown>
    );
};

const HR = () => {
    // Error handling states
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Auto-refresh states
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [tableData, setTableData] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();

    // Bulk mode states
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkRecords, setBulkRecords] = useState([{}]);

    // View mode state (web view or excel view)
    const [viewMode, setViewMode] = useState('web'); // 'web' or 'excel'

    // Priority filter state
    const [priorityFilter, setPriorityFilter] = useState(null);

    // Excel Import Modal State
    const [excelImportModalVisible, setExcelImportModalVisible] = useState(false);

    // HR Categories configuration
    const hrCategories = [
        {
            id: 'meetings',
            name: 'Meetings',
            table: 'hr_meetings',
            type: 'Meeting',
            icon: <CalendarOutlined />,
            dateField: 'date',
            color: '#1890ff',
            hasTimeFields: true,
            hasResponsibleBDM: false // Updated to show all profiles
        },
        {
            id: 'training',
            name: 'Training Programs',
            table: 'hr_training_programs',
            type: 'Training',
            icon: <BookOutlined />,
            dateField: 'date',
            color: '#52c41a',
            hasTimeFields: true,
            hasResponsibleBDM: false // Updated to show all profiles
        },
        {
            id: 'special_events_n_tasks',
            name: 'Special Events & Tasks',
            table: 'hr_special_events_n_tasks',
            type: 'Task',
            icon: <TrophyOutlined />,
            dateField: 'date',
            color: '#fa8c16',
            hasTimeFields: false,
            hasResponsibleBDM: true // This category has responsible BDM field
        }
    ];

    // Priority options
    const priorityOptions = [
        { value: 1, label: 'Low', color: 'green' },
        { value: 2, label: 'Normal', color: 'blue' },
        { value: 3, label: 'Medium', color: 'orange' },
        { value: 4, label: 'High', color: 'red' },
        { value: 5, label: 'Critical', color: 'purple' }
    ];

    // Get default date range: yesterday to 9 days from today (total 10 days)
    const getDefaultDateRange = useCallback(() => {
        try {
            const yesterday = dayjs().subtract(1, 'day');
            const nineDaysFromToday = dayjs().add(9, 'day');
            return [yesterday, nineDaysFromToday];
        } catch (error) {
            console.error('Error getting default date range:', error);
            return [dayjs(), dayjs().add(10, 'day')];
        }
    }, []);

    // Error handler
    const handleError = useCallback((error, context = 'Unknown operation') => {
        console.error(`Error in ${context}:`, error);

        const errorMessage = error?.message || 'An unexpected error occurred';

        toast.error(`Error in ${context}: ${errorMessage}`);

        setError({
            message: errorMessage,
            context,
            timestamp: new Date().toISOString()
        });

        return error;
    }, []);

    // Safe state update wrapper
    const safeSetState = useCallback((setter, value) => {
        try {
            setter(value);
        } catch (err) {
            handleError(err, 'state update');
        }
    }, [handleError]);

    // Safe date parsing function
    const safeDayjs = useCallback((date, format = null) => {
        try {
            if (!date) {
                return dayjs();
            }

            if (dayjs.isDayjs(date)) {
                return date;
            }

            if (typeof date === 'string' || typeof date === 'number') {
                const parsedDate = format ? dayjs(date, format) : dayjs(date);

                if (!parsedDate.isValid()) {
                    console.warn('Invalid date provided:', date);
                    return dayjs();
                }

                return parsedDate;
            }

            console.warn('Unsupported date type:', typeof date, date);
            return dayjs();
        } catch (error) {
            console.error('Error parsing date:', date, error);
            return dayjs();
        }
    }, []);

    // Reset error boundary
    const resetErrorBoundary = useCallback(() => {
        setError(null);
        setRetryCount(prev => prev + 1);
        initializeHR();
    }, []);

    // Auto-refresh setup
    const setupAutoRefresh = useCallback(() => {
        try {
            if (autoRefresh) {
                const interval = setInterval(() => {
                    refreshHRData();
                }, 2 * 60 * 1000); // 2 minutes

                return () => clearInterval(interval);
            }
        } catch (error) {
            handleError(error, 'setting up auto-refresh');
        }
    }, [autoRefresh, handleError]);

    const refreshHRData = async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.info('HR data updated automatically');
        } catch (error) {
            handleError(error, 'auto-refresh');
        } finally {
            setIsRefreshing(false);
        }
    };

    const manualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchTableData();
            safeSetState(setLastRefresh, new Date());
            toast.success('HR data refreshed successfully');
        } catch (error) {
            handleError(error, 'manual refresh');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleAutoRefreshToggle = (checked) => {
        try {
            safeSetState(setAutoRefresh, checked);
            if (checked) {
                toast.info('Auto-refresh enabled (every 2 minutes)');
            } else {
                toast.info('Auto-refresh disabled');
            }
        } catch (error) {
            handleError(error, 'toggle auto-refresh');
        }
    };

    const formatTimeSinceLastRefresh = () => {
        try {
            const now = new Date();
            const diffInSeconds = Math.floor((now - lastRefresh) / 1000);

            if (diffInSeconds < 60) {
                return `${diffInSeconds} seconds ago`;
            } else {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            }
        } catch (error) {
            return 'Unknown';
        }
    };

    // Initialize HR module
    const initializeHR = async () => {
        setLoading(true);
        try {
            await Promise.allSettled([
                fetchCurrentUser(),
                fetchAllProfiles(), // Updated to fetch all profiles
            ]);

            // Set default date range after initialization
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'initializing HR module');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeHR();
    }, [retryCount]);

    useEffect(() => {
        const cleanup = setupAutoRefresh();
        return cleanup;
    }, [setupAutoRefresh]);

    useEffect(() => {
        if (selectedCategory && dateRange[0] && dateRange[1]) {
            fetchTableData();
        }
    }, [selectedCategory, dateRange, priorityFilter]);

    const fetchCurrentUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            if (user) {
                safeSetState(setCurrentUser, user);
            }
        } catch (error) {
            handleError(error, 'fetching current user');
        }
    };

    // Updated to fetch all profiles from the database
    const fetchAllProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, department_id')
                .order('full_name');

            if (error) throw error;
            safeSetState(setProfiles, data || []);
        } catch (error) {
            handleError(error, 'fetching all profiles');
            safeSetState(setProfiles, []);
        }
    };

    const fetchTableData = async () => {
        if (!selectedCategory || !dateRange[0] || !dateRange[1]) return;

        setLoading(true);
        try {
            const startDate = safeDayjs(dateRange[0]).format('YYYY-MM-DD');
            const endDate = safeDayjs(dateRange[1]).format('YYYY-MM-DD');

            if (!startDate || !endDate) {
                throw new Error('Invalid date range provided');
            }

            let query = supabase
                .from(selectedCategory.table)
                .select('*')
                .gte(selectedCategory.dateField, startDate)
                .lte(selectedCategory.dateField, endDate)
                .order('priority', { ascending: false }) // Sort by priority (high to low)
                .order(selectedCategory.dateField, { ascending: true });

            // Apply priority filter if selected
            if (priorityFilter) {
                query = query.eq('priority', priorityFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            safeSetState(setTableData, data || []);
        } catch (error) {
            handleError(error, `fetching ${selectedCategory?.name} data`);
            safeSetState(setTableData, []);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        try {
            safeSetState(setSelectedCategory, category);
            safeSetState(setTableData, []);
            safeSetState(setEditingRecord, null);
            safeSetState(setPriorityFilter, null);
            safeSetState(setViewMode, 'web'); // Reset to web view when category changes
            safeSetState(setBulkMode, false); // Reset bulk mode when category changes
            safeSetState(setBulkRecords, [{}]); // Reset bulk records
            form.resetFields();

            // Set default date range when category is selected
            const defaultRange = getDefaultDateRange();
            safeSetState(setDateRange, defaultRange);
        } catch (error) {
            handleError(error, 'selecting category');
        }
    };

    const handleDateRangeChange = (dates) => {
        try {
            safeSetState(setDateRange, dates || [null, null]);
        } catch (error) {
            handleError(error, 'changing date range');
        }
    };

    const handlePriorityFilterChange = (value) => {
        try {
            safeSetState(setPriorityFilter, value);
        } catch (error) {
            handleError(error, 'changing priority filter');
        }
    };

    const handleCreate = () => {
        try {
            safeSetState(setEditingRecord, null);
            form.resetFields();

            // Initialize bulk records if in bulk mode
            if (bulkMode) {
                safeSetState(setBulkRecords, [{}]);
            }

            safeSetState(setModalVisible, true);
        } catch (error) {
            handleError(error, 'creating new record');
        }
    };

    const handleEdit = (record) => {
        try {
            if (!record || !record.id) {
                throw new Error('Invalid record provided for editing');
            }

            safeSetState(setEditingRecord, record);
            const formattedRecord = { ...record };

            // Format date fields based on category with error handling
            try {
                if (record.date) {
                    formattedRecord.date = safeDayjs(record.date);
                }
                if (record.start_time) {
                    formattedRecord.start_time = safeDayjs(record.start_time, 'HH:mm:ss');
                }
                if (record.end_time) {
                    formattedRecord.end_time = safeDayjs(record.end_time, 'HH:mm:ss');
                }
            } catch (dateError) {
                console.warn('Error formatting dates for editing:', dateError);
            }

            form.setFieldsValue(formattedRecord);
            safeSetState(setModalVisible, true);
        } catch (error) {
            handleError(error, 'editing record');
        }
    };

    const handleDelete = async (record) => {
        try {
            if (!record?.id) throw new Error('Invalid record ID');
            if (!selectedCategory?.table) throw new Error('No category selected');

            const { error } = await supabase
                .from(selectedCategory.table)
                .delete()
                .eq('id', record.id);

            if (error) throw error;

            await notifyDepartmentOperation(
                'hr',
                selectedCategory.name,
                NOTIFICATION_TYPES.DELETE,
                record,
                {
                    tableName: selectedCategory.table,
                    userId: currentUser?.id
                }
            );

            toast.success('Record deleted successfully');
            fetchTableData();
        } catch (error) {
            handleError(error, 'deleting record');
        }
    };

    const handleBulkCreate = async (records) => {
        try {
            if (!selectedCategory?.table) {
                throw new Error('No category selected');
            }

            if (!records || records.length === 0) {
                toast.warning('No records to create');
                return;
            }

            // Validate records
            const validRecords = records.filter(record => {
                // Basic validation - check required fields based on category
                switch (selectedCategory.id) {
                    case 'meetings':
                        return record.date && record.subject;
                    case 'training':
                        return record.date && record.training_program;
                    case 'special_events_n_tasks':
                        return record.date && record.task;
                    default:
                        return true;
                }
            });

            if (validRecords.length === 0) {
                toast.error('Please fill in all required fields for at least one record');
                return;
            }

            if (validRecords.length !== records.length) {
                toast.warning(`Only ${validRecords.length} out of ${records.length} records are valid and will be created`);
            }

            setLoading(true);

            // Prepare data for submission
            const submitData = validRecords.map(record => {
                const preparedRecord = { ...record };

                // Convert dayjs objects to proper formats
                Object.keys(preparedRecord).forEach(key => {
                    try {
                        const value = preparedRecord[key];
                        if (dayjs.isDayjs(value)) {
                            if (key === 'date') {
                                preparedRecord[key] = value.format('YYYY-MM-DD');
                            } else if (key === 'start_time' || key === 'end_time') {
                                preparedRecord[key] = value.format('HH:mm:ss');
                            }
                        }
                    } catch (dateError) {
                        console.warn(`Error converting field ${key}:`, dateError);
                    }
                });

                return preparedRecord;
            });

            // Insert all records
            const { data, error } = await supabase
                .from(selectedCategory.table)
                .insert(submitData)
                .select();

            if (error) throw error;

            // Send notifications for each created record
            for (const record of data) {
                await notifyDepartmentOperation(
                    'hr',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    record,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );
            }

            toast.success(`Successfully created ${data.length} record(s)`);

            // Reset and close
            setModalVisible(false);
            setBulkRecords([{}]);
            fetchTableData();

        } catch (error) {
            handleError(error, 'bulk creating records');
        } finally {
            setLoading(false);
        }
    };

    const handleExcelImportClick = () => {
        try {
            if (!selectedCategory) {
                toast.warning('Please select a category first');
                return;
            }
            safeSetState(setExcelImportModalVisible, true);
        } catch (error) {
            handleError(error, 'opening Excel import');
        }
    };

    const handleExcelImportComplete = () => {
        fetchTableData(); // Refresh table data after import
    };

    const handleFormSubmit = async (values) => {
        try {
            if (!selectedCategory?.table) {
                throw new Error('No category selected');
            }

            // Prepare data for submission
            const submitData = { ...values };

            // Convert dayjs objects to proper formats with error handling
            Object.keys(submitData).forEach(key => {
                try {
                    const value = submitData[key];
                    if (dayjs.isDayjs(value)) {
                        if (key === 'date') {
                            // Convert date to YYYY-MM-DD format
                            submitData[key] = value.format('YYYY-MM-DD');
                        } else if (key === 'start_time' || key === 'end_time') {
                            // Convert time to HH:mm:ss format
                            submitData[key] = value.format('HH:mm:ss');
                        }
                    }
                } catch (dateError) {
                    console.warn(`Error converting date field ${key}:`, dateError);
                }
            });

            let result;

            if (editingRecord) {
                // Update existing record
                const { data, error } = await supabase
                    .from(selectedCategory.table)
                    .update(submitData)
                    .eq('id', editingRecord.id)
                    .select();

                if (error) throw error;
                result = data[0];

                await notifyDepartmentOperation(
                    'hr',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.UPDATE,
                    result,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );

                toast.success('Record updated successfully');
            } else {
                // Create new record
                const { data, error } = await supabase
                    .from(selectedCategory.table)
                    .insert([submitData])
                    .select();

                if (error) throw error;
                result = data[0];

                await notifyDepartmentOperation(
                    'hr',
                    selectedCategory.name,
                    NOTIFICATION_TYPES.CREATE,
                    result,
                    {
                        tableName: selectedCategory.table,
                        userId: currentUser?.id
                    }
                );

                toast.success('Record created successfully');
            }

            safeSetState(setModalVisible, false);
            fetchTableData();
        } catch (error) {
            handleError(error, 'saving record');
        }
    };

    const getTableColumns = () => {
        if (!selectedCategory) return [];

        try {
            const actionColumn = {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 150,
                render: (_, record) => (
                    <Space size="small">
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            size="small"
                        >
                            Edit
                        </Button>
                        <Popconfirm
                            title="Are you sure to delete this record?"
                            onConfirm={() => handleDelete(record)}
                            okText="Yes"
                            cancelText="No"
                            okType="danger"
                        >
                            <Button
                                type="link"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
            };

            const priorityColumn = {
                title: 'Priority',
                dataIndex: 'priority',
                key: 'priority',
                width: 100,
                render: (priority) => <PriorityBadge priority={priority} />,
                sorter: (a, b) => a.priority - b.priority,
            };

            const formatTime = (time) => {
                try {
                    if (!time) return '';
                    return dayjs(time, 'HH:mm:ss').format('HH:mm');
                } catch (error) {
                    return time || '';
                }
            };

            switch (selectedCategory.id) {
                case 'meetings':
                    return [
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Start Time', dataIndex: 'start_time', key: 'start_time', width: 100, render: formatTime },
                        { title: 'End Time', dataIndex: 'end_time', key: 'end_time', width: 100, render: formatTime },
                        { title: 'Subject', dataIndex: 'subject', key: 'subject', width: 200 },
                        priorityColumn,
                        actionColumn
                    ];

                case 'training':
                    return [
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Start Time', dataIndex: 'start_time', key: 'start_time', width: 100, render: formatTime },
                        { title: 'End Time', dataIndex: 'end_time', key: 'end_time', width: 100, render: formatTime },
                        { title: 'Department', dataIndex: 'department', key: 'department', width: 120 },
                        { title: 'Training Program', dataIndex: 'training_program', key: 'training_program', width: 200 },
                        { title: 'Trainer Names', dataIndex: 'trainer_names', key: 'trainer_names', width: 150, 
                          render: (names) => Array.isArray(names) ? names.join(', ') : names },
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                        priorityColumn,
                        actionColumn
                    ];

                case 'special_events_n_tasks':
                    return [
                        { title: 'Date', dataIndex: 'date', key: 'date', width: 120 },
                        { title: 'Task', dataIndex: 'task', key: 'task', width: 200 },
                        { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
                        { title: 'Date Range', dataIndex: 'date_range', key: 'date_range', width: 100, 
                          render: (range) => range ? `${range} days` : '' },
                        priorityColumn,
                        actionColumn
                    ];

                default:
                    return [priorityColumn, actionColumn];
            }
        } catch (error) {
            handleError(error, 'generating table columns');
            return [];
        }
    };

    const getFormFields = () => {
        if (!selectedCategory) return null;

        try {
            const commonFields = (
                <>
                    <Form.Item
                        name="priority"
                        label="Priority"
                        initialValue={2}
                        rules={[{ required: true, message: 'Please select priority' }]}
                    >
                        <Select placeholder="Select priority">
                            {priorityOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    <Space>
                                        <Badge color={option.color} />
                                        {option.label}
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </>
            );

            switch (selectedCategory.id) {
                case 'meetings':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Meeting Date"
                                rules={[{ required: true, message: 'Please select meeting date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select meeting date"
                                />
                            </Form.Item>
                            <Form.Item
                                name="start_time"
                                label="Start Time"
                            >
                                <TimePicker
                                    style={{ width: '100%' }}
                                    format="HH:mm"
                                    placeholder="Select start time"
                                />
                            </Form.Item>
                            <Form.Item
                                name="end_time"
                                label="End Time"
                            >
                                <TimePicker
                                    style={{ width: '100%' }}
                                    format="HH:mm"
                                    placeholder="Select end time"
                                />
                            </Form.Item>
                            <Form.Item
                                name="subject"
                                label="Subject"
                                rules={[{ required: true, message: 'Please enter subject' }]}
                            >
                                <TextArea rows={3} placeholder="Enter meeting subject" />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'training':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Training Date"
                                rules={[{ required: true, message: 'Please select training date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select training date"
                                />
                            </Form.Item>
                            <Form.Item
                                name="start_time"
                                label="Start Time"
                            >
                                <TimePicker
                                    style={{ width: '100%' }}
                                    format="HH:mm"
                                    placeholder="Select start time"
                                />
                            </Form.Item>
                            <Form.Item
                                name="end_time"
                                label="End Time"
                            >
                                <TimePicker
                                    style={{ width: '100%' }}
                                    format="HH:mm"
                                    placeholder="Select end time"
                                />
                            </Form.Item>
                            <Form.Item
                                name="department"
                                label="Department"
                            >
                                <Input placeholder="Enter department" />
                            </Form.Item>
                            <Form.Item
                                name="training_program"
                                label="Training Program"
                                rules={[{ required: true, message: 'Please enter training program' }]}
                            >
                                <TextArea rows={3} placeholder="Enter training program" />
                            </Form.Item>
                            <Form.Item
                                name="trainer_names"
                                label="Trainer Names"
                            >
                                <Select
                                    mode="tags"
                                    placeholder="Enter trainer names (press Enter to add multiple)"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                            >
                                <Input placeholder="Enter status" />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                case 'special_events_n_tasks':
                    return (
                        <>
                            <Form.Item
                                name="date"
                                label="Date"
                                rules={[{ required: true, message: 'Please select date' }]}
                            >
                                <DatePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    placeholder="Select date"
                                />
                            </Form.Item>
                            <Form.Item
                                name="task"
                                label="Task"
                                rules={[{ required: true, message: 'Please enter task' }]}
                            >
                                <TextArea rows={3} placeholder="Enter task" />
                            </Form.Item>
                            <Form.Item
                                name="status"
                                label="Status"
                            >
                                <Input placeholder="Enter status" />
                            </Form.Item>
                            <Form.Item
                                name="date_range"
                                label="Date Range (days)"
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Enter date range in days"
                                    min={1}
                                />
                            </Form.Item>
                            {commonFields}
                        </>
                    );

                default:
                    return commonFields;
            }
        } catch (error) {
            handleError(error, 'generating form fields');
            return <Alert message="Error loading form" type="error" />;
        }
    };

    const getStats = () => {
        try {
            if (!selectedCategory || !tableData.length) {
                return { totalRecords: 0, meetingsCount: 0, trainingCount: 0, specialTasksCount: 0 };
            }

            const totalRecords = tableData.length;
            
            // Count records by category
            const meetingsCount = selectedCategory.id === 'meetings' ? totalRecords : 0;
            const trainingCount = selectedCategory.id === 'training' ? totalRecords : 0;
            const specialTasksCount = selectedCategory.id === 'special_events_n_tasks' ? totalRecords : 0;

            return { totalRecords, meetingsCount, trainingCount, specialTasksCount };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return { totalRecords: 0, meetingsCount: 0, trainingCount: 0, specialTasksCount: 0 };
        }
    };

    // Render error state
    if (error && retryCount > 2) {
        return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
    }

    // Render loading state
    if (loading && !selectedCategory) {
        return <LoadingSpinner tip="Loading HR module..." />;
    }

    const stats = getStats();

    return (
        <div style={{ padding: '16px', maxWidth: '1400px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={5000} />

            {/* Error Alert */}
            {error && (
                <Alert
                    message="HR Module Error"
                    description={`${error.context}: ${error.message}`}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                    action={
                        <Button size="small" type="primary" onClick={resetErrorBoundary}>
                            Retry
                        </Button>
                    }
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Header with Controls */}
            <Card
                size="small"
                style={{ 
                    marginBottom: 16, 
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '2px solid #1890ff20'
                }}
                bodyStyle={{ padding: '12px 16px' }}
            >
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <Title level={2} style={{ margin: 0, fontSize: '24px' }}>
                            <TeamOutlined /> HR Department
                        </Title>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Text type="secondary" style={{ fontSize: '14px', display: 'block' }}>
                                <ClockCircleOutlined /> Last updated: {formatTimeSinceLastRefresh()}
                            </Text>
                            <Space style={{ flexWrap: 'wrap' }}>
                                <Button
                                    icon={<SyncOutlined spin={isRefreshing} />}
                                    onClick={manualRefresh}
                                    loading={isRefreshing}
                                    size="medium"
                                >
                                    Refresh
                                </Button>
                                <Switch
                                    checkedChildren="Auto On"
                                    unCheckedChildren="Auto Off"
                                    checked={autoRefresh}
                                    onChange={handleAutoRefreshToggle}
                                />
                            </Space>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {autoRefresh && (
                <Alert
                    message="Auto-refresh Enabled"
                    description="HR data will automatically update every 2 minutes."
                    type="info"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Category Cards */}
            <Card
                title="HR Categories"
                style={{ marginBottom: 24 }}
                extra={
                    <Tag color="blue">
                        {hrCategories.length} Categories Available
                    </Tag>
                }
            >
                <Row gutter={[16, 16]}>
                    {hrCategories.map((category) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={category.id}>
                            <CategoryCard
                                category={category}
                                isSelected={selectedCategory?.id === category.id}
                                onClick={() => handleCategoryClick(category)}
                                loading={loading}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* View Mode Selection and Date Range Filter */}
            {selectedCategory && (
                <Card
                    title={
                        <Space>
                            <FilterOutlined />
                            Filter Data & View Options
                            <Tag color="blue">
                                Default: {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                            </Tag>
                        </Space>
                    }
                    style={{ marginBottom: 24 }}
                    extra={
                        <Space>
                            <Radio.Group 
                                value={viewMode} 
                                onChange={(e) => setViewMode(e.target.value)}
                                buttonStyle="solid"
                            >
                                <Radio.Button value="web">
                                    <AppstoreOutlined /> Web View
                                </Radio.Button>
                                <Radio.Button value="excel">
                                    <FileExcelOutlined /> Excel View
                                </Radio.Button>
                            </Radio.Group>

                            {/* Bulk Mode Toggle */}
                            <Switch
                                checkedChildren="Multiple"
                                unCheckedChildren="Single"
                                checked={bulkMode}
                                onChange={(checked) => {
                                    setBulkMode(checked);
                                    if (checked) {
                                        // Initialize with one empty record when switching to bulk mode
                                        setBulkRecords([{}]);
                                    }
                                }}
                            />

                            {/* Excel Import Button */}
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={handleExcelImportClick}
                                size="large"
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Upload Excel
                            </Button>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreate}
                                loading={loading}
                                size="large"
                            >
                                Add New Record{bulkMode ? 's (Multiple)' : ''}
                            </Button>
                        </Space>
                    }
                >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <Text>Select date range to view {selectedCategory.name} data:</Text>
                                <RangePicker
                                    onChange={handleDateRangeChange}
                                    value={dateRange}
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabled={loading}
                                />
                            </Col>
                            <Col xs={24} md={12}>
                                <Text>Filter by priority:</Text>
                                <Select
                                    placeholder="All Priorities"
                                    value={priorityFilter}
                                    onChange={handlePriorityFilterChange}
                                    style={{ width: '100%' }}
                                    allowClear
                                >
                                    {priorityOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            <Space>
                                                <Badge color={option.color} />
                                                {option.label}
                                            </Space>
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>
                        {dateRange[0] && dateRange[1] && (
                            <Text type="secondary">
                                Showing data from {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} to {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                                {priorityFilter && ` • Priority: ${priorityOptions.find(opt => opt.value === priorityFilter)?.label}`}
                                <Text style={{ marginLeft: 8, color: '#1890ff' }}>
                                    (Default range: Yesterday to 9 days from today)
                                </Text>
                            </Text>
                        )}
                    </Space>
                </Card>
            )}

            {/* Statistics */}
            {selectedCategory && dateRange[0] && dateRange[1] && (
                <HRStatistics stats={stats} loading={loading} />
            )}

            {/* Data Table or Export Button */}
            {selectedCategory && dateRange[0] && dateRange[1] && (
                <Card
                    title={
                        <Space>
                            {selectedCategory.icon}
                            {selectedCategory.name} Data - {viewMode === 'web' ? 'Web View' : 'Excel View'}
                            <Badge count={tableData.length} showZero color="#1890ff" />
                        </Space>
                    }
                    extra={
                        <Space>
                            <Tag color="blue">
                                {safeDayjs(dateRange[0]).format('DD/MM/YYYY')} - {safeDayjs(dateRange[1]).format('DD/MM/YYYY')}
                            </Tag>
                            {priorityFilter && (
                                <Tag color={priorityOptions.find(opt => opt.value === priorityFilter)?.color}>
                                    Priority: {priorityOptions.find(opt => opt.value === priorityFilter)?.label}
                                </Tag>
                            )}
                            {viewMode === 'excel' && (
                                <ExportButton
                                    activities={tableData}
                                    selectedCategory={selectedCategory}
                                    moduleName={selectedCategory.table}
                                    priorityLabels={Object.fromEntries(
                                        priorityOptions.map(opt => [opt.value, opt.label])
                                    )}
                                    allProfiles={profiles}
                                />
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={manualRefresh}
                                loading={loading}
                                size="small"
                            >
                                Refresh Data
                            </Button>
                        </Space>
                    }
                >
                    {loading ? (
                        <LoadingSpinner tip={`Loading ${selectedCategory.name} data...`} />
                    ) : tableData.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <Space direction="vertical">
                                    <Text>No records found for selected criteria</Text>
                                    <Text type="secondary">Try selecting a different date range, priority filter, or create new records</Text>
                                    <div>
                                        <Button type="primary" onClick={handleCreate} style={{ marginRight: 8 }}>
                                            <PlusOutlined /> Create First Record
                                        </Button>
                                        <Button
                                            type="default"
                                            icon={<UploadOutlined />}
                                            onClick={handleExcelImportClick}
                                        >
                                            Upload Excel Data
                                        </Button>
                                    </div>
                                </Space>
                            }
                        />
                    ) : viewMode === 'web' ? (
                        <Table
                            columns={getTableColumns()}
                            dataSource={tableData.map(item => ({ ...item, key: item.id }))}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} items`
                            }}
                            scroll={{ x: true }}
                            size="middle"
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <FileExcelOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                            <Title level={4}>Ready to Export Data</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
                                Use the Export dropdown button above to download {tableData.length} records in Excel or Word format.
                            </Text>
                            <Alert
                                message="Excel View Mode"
                                description="In Excel View mode, you can export the data to XLSX or Word format for offline analysis. Switch to Web View for editing and deleting features."
                                type="info"
                                showIcon
                            />
                        </div>
                    )}
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingRecord ? <EditOutlined /> : <PlusOutlined />}
                        {editingRecord ? 'Edit' : bulkMode ? 'Create Multiple' : 'Create'} {selectedCategory?.name} Record
                        {bulkMode && !editingRecord && (
                            <Tag color="orange">Bulk Mode: {bulkRecords.length} records</Tag>
                        )}
                    </Space>
                }
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setBulkRecords([{}]); // Reset bulk records when closing
                }}
                footer={null}
                width={bulkMode && !editingRecord ? 800 : 600}
                destroyOnClose
            >
                {editingRecord ? (
                    // Single Edit Mode (existing code)
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFormSubmit}
                    >
                        {getFormFields()}
                        <Divider />
                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setModalVisible(false)}>
                                    Cancel
                                </Button>
                                <Button type="primary" htmlType="submit" size="large">
                                    Update Record
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                ) : bulkMode ? (
                    // Bulk Create Mode
                    <div>
                        <BulkFormFields
                            records={bulkRecords}
                            onChange={setBulkRecords}
                            category={selectedCategory}
                            priorityOptions={priorityOptions}
                            safeDayjs={safeDayjs}
                            allProfiles={profiles}
                        />
                        <Divider />
                        <div style={{ textAlign: 'right' }}>
                            <Space>
                                <Button
                                    onClick={() => {
                                        setModalVisible(false);
                                        setBulkRecords([{}]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => handleBulkCreate(bulkRecords)}
                                    size="large"
                                    loading={loading}
                                >
                                    Create {bulkRecords.length} Record{bulkRecords.length > 1 ? 's' : ''}
                                </Button>
                            </Space>
                        </div>
                    </div>
                ) : (
                    // Single Create Mode (existing code)
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFormSubmit}
                    >
                        {getFormFields()}
                        <Divider />
                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={() => setModalVisible(false)}>
                                    Cancel
                                </Button>
                                <Button type="primary" htmlType="submit" size="large">
                                    Create Record
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                )}
            </Modal>

            {/* Excel Import Modal */}
            <ExcelImportModal
                visible={excelImportModalVisible}
                onCancel={() => setExcelImportModalVisible(false)}
                selectedCategory={selectedCategory}
                onImportComplete={handleExcelImportComplete}
                allProfiles={profiles}
            />

            {/* Instructions */}
            {!selectedCategory && (
                <Card title="How to Use HR Module" style={{ borderRadius: '12px' }}>
                    <Alert
                        message="Manage HR Department Data"
                        description={
                            <div>
                                <Text strong>Follow these steps:</Text>
                                <ol>
                                    <li>Click on any category card above to select a data type</li>
                                    <li>Choose between Web View (for editing) or Excel View (for export)</li>
                                    <li>Date range is automatically set to yesterday to 9 days from today</li>
                                    <li>Use priority filter to view high-priority items first</li>
                                    <li>In Web View: Use Edit/Delete actions</li>
                                    <li>In Excel View: Export data to XLSX or Word for offline analysis</li>
                                    <li>Use the Single/Multiple toggle to switch between single and bulk record creation</li>
                                    <li>Use "Upload Excel" to import data from Excel files with validation</li>
                                    <li>For categories with Responsible BDM field, use Bulk Records instead of Excel import</li>
                                </ol>
                                <Text type="secondary">
                                    Each category represents different HR activities recorded in the system.
                                    Web View provides full interactive features while Excel View is for read-only data export.
                                    Bulk mode allows creating multiple records at once for better productivity.
                                    Excel import feature helps in bulk data entry with proper validation.
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </Card>
            )}
        </div>
    );
};

export default HR;
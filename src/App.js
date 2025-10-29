// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import ResetPasswordSuccess from './components/Auth/ResetPasswordSuccess';
import DashboardLayout from './components/Layout/DashboardLayout';
import Dashboard from './components/Dashboard/Dashboard'
import Departments from './components/Departments/Departments';
import Profile from './components/Personal/Profile';
import NotificationPanel from './components/notifications/NotificationPanel';
import { notify } from './components/notifications/notify';
import OopsPage from './components/Layout/OopsPage';
import { scheduleWeeklyCheck } from './components/sms.js';

import BDM from './components/Schedules/BDM_Schedules';
import Cluster1 from './components/Schedules/Cluster_1';
import Cluster2 from './components/Schedules/Cluster_2';
import Cluster3 from './components/Schedules/Cluster_3';
import Cluster4 from './components/Schedules/Cluster_4';
import Cluster5 from './components/Schedules/Cluster_5';
import Cluster6 from './components/Schedules/Cluster_6';
import CustomerCare from './components/Schedules/Customer_Care';
import EHealthcare from './components/Schedules/eHealthcare.js';
import HiTech from './components/Schedules/HiTech.js';
import HR from './components/Schedules/Hr.js';
import Import from './components/Schedules/Imports.js';
import Regulatory from './components/Schedules/Regulatory.js';
import SalesOperations from './components/Schedules/SalesOperations.js';
import SeniorManagement from './components/Schedules/Senior_Management.js';
import SOMT from './components/Schedules/SOMT.js';
import Stores from './components/Schedules/Stores.js';
import SurgiSurgicare from './components/Schedules/Surge-Surgecare.js';
import SurgeImaging from './components/Schedules/Surge-Surgecare-Image.js';


import 'antd/dist/reset.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return !user ? children : <Navigate to="/dashboard" />;
};

// Main App Content with Notification Panel
function AppContent() {
  useEffect(() => {
    console.log('🚀 Starting Schedify Weekly Check Scheduler...');
    scheduleWeeklyCheck();
  }, []);
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-success"
          element={
            <PublicRoute>
              <ResetPasswordSuccess />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="departments" element={<Departments />} />
          <Route path="personal" element={<Profile />} />
          <Route path="departments/bdm" element={<BDM />} />
          <Route path="departments/after-sales" element={<OopsPage />} />
          <Route path="departments/cluster-1" element={<Cluster1 />} />
          <Route path="departments/cluster-2" element={<Cluster2 />} />
          <Route path="departments/cluster-3" element={<Cluster3 />} />
          <Route path="departments/cluster-4" element={<Cluster4 />} />
          <Route path="departments/cluster-5" element={<Cluster5 />} />
          <Route path="departments/cluster-6" element={<Cluster6 />} />
          <Route path="departments/customer-care" element={<CustomerCare />} />
          <Route path="departments/e-healthcare" element={<EHealthcare />} />
          <Route path="departments/hi-tech" element={<HiTech />} />
          <Route path="departments/hr" element={<HR />} />
          <Route path="departments/finance" element={<OopsPage />} />
          <Route path="departments/it" element={<OopsPage />} />
          <Route path="departments/imports" element={<Import />} />
          <Route path="departments/regulatory" element={<Regulatory />} />
          <Route path="departments/sales-operations" element={<SalesOperations />} />
          <Route path="departments/senior-management" element={<SeniorManagement />} />
          <Route path="departments/somt" element={<SOMT />} />
          <Route path="departments/stores" element={<Stores />} />
          <Route path="departments/surge-surgecare" element={<SurgiSurgicare />} />
          <Route path="departments/surge-surgecare-image" element={<SurgeImaging />} />
          <Route path="/analytics" element={<OopsPage />} />


          <Route index element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
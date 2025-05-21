import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { configureAmplify } from './amplify/backend';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';

// Auth components
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';

// Layout component
import Header from './components/layouts/Header';

// Pages
import Dashboard from './pages/Dashboard';
import JobsPage from './pages/JobsPage';
import JobDetails from './pages/JobDetails';
import JobEdit from './pages/JobEdit';
import ManagementPage from './pages/ManagementPage';
import AnalysisPage from './pages/AnalysisPage';
import ReportsPage from './pages/ReportsPage';

// Initialize Amplify
configureAmplify();

// Loading indicator
const LoadingFallback = () => <div className="loading-indicator">Loading...</div>;

// RequireAuth wrapper blocks unauthenticated users
const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Layout with header for all protected pages
const AuthenticatedLayout = () => (
  <div className="app-container">
    <Header />
    <main className="main-content">
      <Outlet />
    </main>
  </div>
);

const App = () => (
  <Router>
    <AuthProvider>
      <SyncProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AuthenticatedLayout />}>
              {/* Default redirect */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/today" element={<JobsPage filter="today" />} />
              <Route path="jobs/add" element={<JobsPage action="add" />} />
              <Route path="jobs/:jobId" element={<JobDetails />} />
              <Route path="jobs/:jobId/edit" element={<JobEdit />} />
              <Route path="manage" element={<ManagementPage />} />
              <Route path="manage/employees" element={<ManagementPage defaultTab="employees" />} />
              <Route path="manage/teams" element={<ManagementPage defaultTab="teams" />} />
              <Route path="manage/other" element={<ManagementPage defaultTab="other" />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="analysis" element={<AnalysisPage />} />
              <Route path="settings" element={<Navigate to="/manage/other" replace />} />

              {/* Catch-all for authenticated users */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </SyncProvider>
    </AuthProvider>
  </Router>
);

export default App;

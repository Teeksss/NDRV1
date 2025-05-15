import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { CircularProgress, Box } from '@mui/material';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LogoutPage from './pages/LogoutPage';

// Dashboard and overview pages
import DashboardPage from './pages/DashboardPage';
import SecurityDashboardPage from './pages/SecurityDashboardPage';
import NetworkOverviewPage from './pages/NetworkOverviewPage';

// Feature pages
import AlertsPage from './pages/AlertsPage';
import AlertDetailPage from './pages/AlertDetailPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EntitiesPage from './pages/EntitiesPage';
import EntityDetailPage from './pages/EntityDetailPage';
import CorrelationRulesPage from './pages/CorrelationRulesPage';
import CorrelationRuleDetailPage from './pages/CorrelationRuleDetailPage';
import ReportsPage from './pages/ReportsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import NotificationsPage from './pages/NotificationsPage';

// User and settings pages
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Error pages
import NotFoundPage from './pages/NotFoundPage';

// Hooks
import { useAuth } from './hooks/useAuth';

// Lazy loaded pages
const NetworkScanPage = React.lazy(() => import('./pages/NetworkScanPage'));
const ThreatIntelligencePage = React.lazy(() => import('./pages/ThreatIntelligencePage'));
const AuditLogPage = React.lazy(() => import('./pages/AuditLogPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));

// Guards
const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <SnackbarProvider maxSnack={5}>
        <AuthProvider>
          <SettingsProvider>
            <NotificationProvider>
              <WebSocketProvider>
                <Router>
                  <Routes>
                    {/* Auth routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/logout" element={<LogoutPage />} />
                    
                    {/* App routes */}
                    <Route element={<AuthenticatedRoute><AppLayout /></AuthenticatedRoute>}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="security" element={<SecurityDashboardPage />} />
                      <Route path="network" element={<NetworkOverviewPage />} />
                      
                      <Route path="alerts" element={<AlertsPage />} />
                      <Route path="alerts/:id" element={<AlertDetailPage />} />
                      
                      <Route path="events" element={<EventsPage />} />
                      <Route path="events/:id" element={<EventDetailPage />} />
                      
                      <Route path="entities" element={<EntitiesPage />} />
                      <Route path="entities/:id" element={<EntityDetailPage />} />
                      
                      <Route path="rules" element={<CorrelationRulesPage />} />
                      <Route path="rules/:id" element={<CorrelationRuleDetailPage />} />
                      
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="reports/:id" element={<ReportDetailPage />} />
                      
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      
                      {/* Lazy loaded routes */}
                      <Route path="network-scan" element={
                        <React.Suspense fallback={
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                          </Box>
                        }>
                          <NetworkScanPage />
                        </React.Suspense>
                      } />
                      
                      <Route path="threat-intelligence" element={
                        <React.Suspense fallback={
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                          </Box>
                        }>
                          <ThreatIntelligencePage />
                        </React.Suspense>
                      } />
                      
                      <Route path="audit-log" element={
                        <React.Suspense fallback={
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                          </Box>
                        }>
                          <AuditLogPage />
                        </React.Suspense>
                      } />
                      
                      <Route path="help" element={
                        <React.Suspense fallback={
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                          </Box>
                        }>
                          <HelpPage />
                        </React.Suspense>
                      } />
                    </Route>
                    
                    {/* 404 route */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Router>
              </WebSocketProvider>
            </NotificationProvider>
          </SettingsProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
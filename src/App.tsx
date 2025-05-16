import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout';
import { Spinner } from './components/ui';
import { authActions } from './store/auth/actions';
import { RootState } from './store/types';
import { usePermissions } from './hooks/usePermissions';
import { 
  LoginPage, 
  DashboardPage, 
  AlertsPage, 
  NetworkMapPage, 
  DevicesPage,
  TrafficAnalysisPage,
  NDRDashboardPage,
  AnomalyDetectionPage,
  ThreatIntelPage,
  PacketCapturePage,
  SettingsPage,
  NotFoundPage
} from './pages';
import './App.scss';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  
  const { isAuthenticated, loading: authLoading, user } = useSelector(
    (state: RootState) => state.auth
  );
  
  // Kullanıcı oturumunu kontrol et
  useEffect(() => {
    dispatch(authActions.checkSession());
  }, [dispatch]);
  
  // Auth yükleme durumunda loading göster
  if (authLoading) {
    return (
      <div className="app-loading">
        <Spinner size="large" />
        <p>Uygulama yükleniyor...</p>
      </div>
    );
  }
  
  // Korumalı rota bileşeni
  const ProtectedRoute: React.FC<{ 
    element: React.ReactNode; 
    permission?: string;
  }> = ({ element, permission }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (permission && !hasPermission(permission)) {
      return <Navigate to="/not-found" />;
    }
    
    return <>{element}</>;
  };
  
  return (
    <ThemeProvider>
      <Router>
        {isAuthenticated ? (
          <Layout>
            <Routes>
              <Route 
                path="/" 
                element={
                  <ProtectedRoute 
                    element={<DashboardPage />} 
                    permission="view:dashboard"
                  />
                } 
              />
              <Route 
                path="/alerts" 
                element={
                  <ProtectedRoute 
                    element={<AlertsPage />} 
                    permission="view:alerts"
                  />
                } 
              />
              <Route 
                path="/network-map" 
                element={
                  <ProtectedRoute 
                    element={<NetworkMapPage />} 
                    permission="view:network_map"
                  />
                } 
              />
              <Route 
                path="/devices" 
                element={
                  <ProtectedRoute 
                    element={<DevicesPage />} 
                    permission="view:devices"
                  />
                } 
              />
              <Route 
                path="/traffic" 
                element={
                  <ProtectedRoute 
                    element={<TrafficAnalysisPage />} 
                    permission="view:traffic"
                  />
                } 
              />
              <Route 
                path="/ndr" 
                element={
                  <ProtectedRoute 
                    element={<NDRDashboardPage />} 
                    permission="view:ndr_dashboard"
                  />
                } 
              />
              <Route 
                path="/anomalies" 
                element={
                  <ProtectedRoute 
                    element={<AnomalyDetectionPage />} 
                    permission="view:anomalies"
                  />
                } 
              />
              <Route 
                path="/threat-intelligence" 
                element={
                  <ProtectedRoute 
                    element={<ThreatIntelPage />} 
                    permission="view:threat_intel"
                  />
                } 
              />
              <Route 
                path="/packet-capture" 
                element={
                  <ProtectedRoute 
                    element={<PacketCapturePage />} 
                    permission="capture:packets"
                  />
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute 
                    element={<SettingsPage />} 
                    permission="view:settings"
                  />
                } 
              />
              <Route path="/not-found" element={<NotFoundPage />} />
              <Route path="*" element={<Navigate to="/not-found" />} />
            </Routes>
          </Layout>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </Router>
    </ThemeProvider>
  );
};

export default App;
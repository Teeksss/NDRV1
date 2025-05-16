import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Card, Tabs, Tab, Button, Spinner, Modal } from '@/components/ui';
import { 
  AlertsPanel, 
  TrafficAnalytics, 
  NetworkMapWidget, 
  ThreatIntelligenceFeed,
  DeviceStatusPanel,
  TopProtocolsChart,
  AnomalyDetectionWidget,
  SecurityScoreWidget,
  GeographicalThreatMap,
  EventTimeline
} from '@/components/widgets';
import { DashboardToolbar } from '@/components/Dashboard/DashboardToolbar';
import { DashboardCustomizer } from '@/components/Dashboard/DashboardCustomizer';
import { ReportGenerator } from '@/components/Reports/ReportGenerator';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { dashboardActions } from '@/store/dashboard/actions';
import { alertActions } from '@/store/alerts/actions';
import { RootState } from '@/store/types';
import { DashboardLayout, WidgetConfig } from '@/types/dashboard';
import { TimeRange } from '@/types/analytics';
import { appConfig, featureFlags } from '@/config/app.config';
import { logger } from '@/utils/logger';
import './NDRDashboard.scss';

const NDRDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const { layout, saveLayout, resetLayout } = useDashboardLayout();
  
  // Redux selectors
  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    lastUpdated
  } = useSelector((state: RootState) => state.dashboard);
  
  const { alertCount } = useSelector((state: RootState) => state.alerts);
  
  // State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  // WebSocket connection for real-time updates
  const { isConnected, lastMessage, sendMessage } = useWebSocket({
    url: `${appConfig.wsUrl}/dashboard`,
    onMessage: (data) => handleRealtimeUpdate(data)
  });
  
  // Load dashboard data
  useEffect(() => {
    dispatch(dashboardActions.fetchDashboardData(timeRange));
    
    // Set up auto-refresh
    let intervalId: number;
    if (autoRefresh) {
      intervalId = window.setInterval(() => {
        dispatch(dashboardActions.fetchDashboardData(timeRange));
      }, appConfig.dataRefreshIntervals.dashboard);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispatch, timeRange, autoRefresh]);
  
  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = useCallback((data: any) => {
    try {
      const { type, payload } = JSON.parse(data);
      
      switch (type) {
        case 'NEW_ALERT':
          dispatch(alertActions.addAlert(payload));
          break;
        case 'TRAFFIC_UPDATE':
          dispatch(dashboardActions.updateTrafficData(payload));
          break;
        case 'DEVICE_STATUS_CHANGE':
          dispatch(dashboardActions.updateDeviceStatus(payload));
          break;
        case 'ANOMALY_DETECTED':
          dispatch(dashboardActions.addAnomaly(payload));
          dispatch(alertActions.addAlert({
            ...payload,
            type: 'anomaly',
            severity: payload.score > 0.8 ? 'critical' : 'high'
          }));
          break;
        default:
          logger.debug('Unknown real-time update type:', type);
      }
    } catch (error) {
      logger.error('Error processing real-time update:', error);
    }
  }, [dispatch]);
  
  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    dispatch(dashboardActions.fetchDashboardData(range));
  };
  
  // Handle layout changes
  const handleLayoutChange = (newLayout: DashboardLayout) => {
    saveLayout(newLayout);
  };
  
  // Handle device selection
  const handleDeviceSelect = (deviceIds: string[]) => {
    setSelectedDevices(deviceIds);
    sendMessage(JSON.stringify({ 
      type: 'SUBSCRIBE_DEVICES', 
      deviceIds 
    }));
  };
  
  // Toggle custom layout mode
  const toggleCustomizeMode = () => {
    setIsCustomizing(!isCustomizing);
  };
  
  // Handle report generation
  const handleGenerateReport = () => {
    setShowReportModal(true);
  };
  
  // Refresh dashboard data manually
  const handleRefresh = () => {
    dispatch(dashboardActions.fetchDashboardData(timeRange));
  };
  
  return (
    <div className="ndr-dashboard">
      <DashboardToolbar 
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onCustomize={toggleCustomizeMode}
        onGenerateReport={handleGenerateReport}
        lastUpdated={lastUpdated}
        isCustomizing={isCustomizing}
        isWebSocketConnected={isConnected}
        alertCount={alertCount}
      />
      
      <Tabs value={activeTab} onChange={(tab) => setActiveTab(tab)}>
        <Tab value="overview" label="Genel Bakış" />
        <Tab value="traffic" label="Trafik Analizi" />
        <Tab value="threats" label="Tehdit Analizi" />
        <Tab value="devices" label="Cihazlar" />
        <Tab value="anomalies" label="Anomaliler" />
      </Tabs>
      
      {dashboardLoading && !dashboardData ? (
        <div className="ndr-dashboard__loading">
          <Spinner size="large" />
          <p>Dashboard yükleniyor...</p>
        </div>
      ) : dashboardError ? (
        <Card className="ndr-dashboard__error">
          <h3>Dashboard yüklenirken bir hata oluştu</h3>
          <p>{dashboardError}</p>
          <Button variant="primary" onClick={handleRefresh}>Yeniden Dene</Button>
        </Card>
      ) : (
        <>
          {isCustomizing ? (
            <DashboardCustomizer 
              layout={layout}
              onSave={handleLayoutChange}
              onCancel={() => setIsCustomizing(false)}
              onReset={resetLayout}
              availableWidgets={getAvailableWidgets(activeTab)}
            />
          ) : (
            <div className="ndr-dashboard__content">
              {/* Ana Dashboard İçeriği */}
              {activeTab === 'overview' && (
                <Grid layout={layout.overview}>
                  <SecurityScoreWidget 
                    score={dashboardData?.securityScore || 0}
                    previousScore={dashboardData?.previousSecurityScore || 0}
                    issues={dashboardData?.securityIssues || []}
                  />
                  
                  <AlertsPanel 
                    limit={8}
                    autoRefresh={autoRefresh}
                    refreshInterval={appConfig.dataRefreshIntervals.alerts}
                  />
                  
                  {featureFlags.enableNetworkMap && (
                    <NetworkMapWidget 
                      selectedDevices={selectedDevices}
                      onDeviceSelect={handleDeviceSelect}
                      autoRefresh={autoRefresh}
                      refreshInterval={appConfig.dataRefreshIntervals.networkMap}
                    />
                  )}
                  
                  <DeviceStatusPanel 
                    devices={dashboardData?.devices || []}
                    onDeviceClick={(deviceId) => handleDeviceSelect([deviceId])}
                  />
                  
                  <TopProtocolsChart 
                    data={dashboardData?.topProtocols || []}
                    timeRange={timeRange}
                  />
                  
                  {featureFlags.enableAnomalyDetection && (
                    <AnomalyDetectionWidget 
                      anomalies={dashboardData?.anomalies || []}
                      timeRange={timeRange}
                    />
                  )}
                  
                  {featureFlags.enableGeographicalData && (
                    <GeographicalThreatMap 
                      threats={dashboardData?.geographicalThreats || []}
                      timeRange={timeRange}
                    />
                  )}
                </Grid>
              )}
              
              {/* Trafik Analizi Sekmesi */}
              {activeTab === 'traffic' && (
                <Grid layout={layout.traffic}>
                  <TrafficAnalytics 
                    trafficData={dashboardData?.trafficData || []}
                    timeRange={timeRange}
                    autoRefresh={autoRefresh}
                    refreshInterval={appConfig.dataRefreshIntervals.trafficAnalytics}
                  />
                  
                  <TopProtocolsChart 
                    data={dashboardData?.topProtocols || []}
                    timeRange={timeRange}
                    detailed
                  />
                  
                  {/* Diğer trafik analiz bileşenleri */}
                </Grid>
              )}
              
              {/* Tehdit Analizi Sekmesi */}
              {activeTab === 'threats' && (
                <Grid layout={layout.threats}>
                  <AlertsPanel 
                    limit={20}
                    autoRefresh={autoRefresh}
                    refreshInterval={appConfig.dataRefreshIntervals.alerts}
                    detailedView
                  />
                  
                  {featureFlags.enableThreatIntelligence && (
                    <ThreatIntelligenceFeed 
                      threats={dashboardData?.threatIntelligence || []}
                      timeRange={timeRange}
                    />
                  )}
                  
                  <EventTimeline 
                    events={dashboardData?.securityEvents || []}
                    timeRange={timeRange}
                  />
                  
                  {/* Diğer tehdit analiz bileşenleri */}
                </Grid>
              )}
              
              {/* Cihazlar Sekmesi */}
              {activeTab === 'devices' && (
                <Grid layout={layout.devices}>
                  <DeviceStatusPanel 
                    devices={dashboardData?.devices || []}
                    onDeviceClick={(deviceId) => handleDeviceSelect([deviceId])}
                    detailed
                  />
                  
                  {/* Diğer cihaz bileşenleri */}
                </Grid>
              )}
              
              {/* Anomaliler Sekmesi */}
              {activeTab === 'anomalies' && featureFlags.enableAnomalyDetection && (
                <Grid layout={layout.anomalies}>
                  <AnomalyDetectionWidget 
                    anomalies={dashboardData?.anomalies || []}
                    timeRange={timeRange}
                    detailed
                  />
                  
                  {/* Diğer anomali bileşenleri */}
                </Grid>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Rapor Oluşturma Modalı */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Güvenlik Raporu Oluştur"
        size="large"
      >
        <ReportGenerator 
          timeRange={timeRange}
          dashboardData={dashboardData}
          selectedDevices={selectedDevices}
          onClose={() => setShowReportModal(false)}
        />
      </Modal>
    </div>
  );
};

// Mevcut sekmeye göre kullanılabilir widget'ları getir
const getAvailableWidgets = (tab: string): WidgetConfig[] => {
  // Tab'e göre widget listesi döndür
  const commonWidgets: WidgetConfig[] = [
    { id: 'alerts', title: 'Güvenlik Uyarıları', component: 'AlertsPanel', permissions: ['view:alerts'] },
    { id: 'deviceStatus', title: 'Cihaz Durumu', component: 'DeviceStatusPanel', permissions: ['view:devices'] }
  ];
  
  switch (tab) {
    case 'overview':
      return [
        ...commonWidgets,
        { id: 'securityScore', title: 'Güvenlik Skoru', component: 'SecurityScoreWidget', permissions: ['view:dashboard'] },
        { id: 'networkMap', title: 'Ağ Haritası', component: 'NetworkMapWidget', permissions: ['view:network'] },
        { id: 'topProtocols', title: 'En Çok Kullanılan Protokoller', component: 'TopProtocolsChart', permissions: ['view:traffic'] },
        { id: 'anomalyDetection', title: 'Anomali Tespiti', component: 'AnomalyDetectionWidget', permissions: ['view:anomalies'] },
        { id: 'geographicalThreats', title: 'Coğrafi Tehdit Haritası', component: 'GeographicalThreatMap', permissions: ['view:threats'] }
      ];
    case 'traffic':
      return [
        { id: 'trafficAnalytics', title: 'Trafik Analizi', component: 'TrafficAnalytics', permissions: ['view:traffic'] },
        { id: 'topProtocols', title: 'En Çok Kullanılan Protokoller', component: 'TopProtocolsChart', permissions: ['view:traffic'] },
        { id: 'bandwidth', title: 'Bant Genişliği Kullanımı', component: 'BandwidthUsageChart', permissions: ['view:traffic'] },
        { id: 'connections', title: 'Aktif Bağlantılar', component: 'ConnectionsWidget', permissions: ['view:traffic'] }
      ];
    // Diğer tab'ler için widget tanımları
    default:
      return commonWidgets;
  }
};

export default NDRDashboard;
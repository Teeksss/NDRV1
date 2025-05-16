import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PageHeader, Card, Spinner, Alert, Grid, Button, Select, Tabs, Tab, Badge } from '@/components/ui';
import { 
  RefreshIcon, 
  ChartIcon, 
  ClockIcon, 
  CalendarIcon, 
  DownloadIcon, 
  FilterIcon 
} from '@/components/icons';
import { 
  NDRServiceStatusWidget,
  SecurityScoreWidget,
  NDREventsWidget,
  TopProtocolsChart,
  NetworkMapWidget,
  ThreatIntelWidget
} from '@/components/widgets';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { TimeRangeSelector } from '@/components/common/TimeRangeSelector';
import { ndrActions } from '@/store/ndr/actions';
import { RootState } from '@/store/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDate } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import './NDROverviewPage.scss';

/**
 * NDR genel bakış sayfası
 * Bu sayfa, tüm NDR çözümünün temel metriklerini ve özetini gösterir
 */
const NDROverviewPage: React.FC = () => {
  const dispatch = useDispatch();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [systemSummary, setSystemSummary] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string>('summary');
  
  // Redux state
  const { timeRange, serviceStatus } = useSelector((state: RootState) => state.ndr);
  
  // Set page title
  usePageTitle('NDR Genel Bakış - NDRV1');
  
  // Load initial data
  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, [dispatch, timeRange]);
  
  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch service status
      dispatch(ndrActions.fetchServiceStatus());
      
      // Fetch overall system summary
      const summary = await NDRIntegrationService.getSystemSummary(timeRange);
      setSystemSummary(summary);
      
      // Update last updated timestamp
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      logger.error('Error fetching NDR overview data:', err);
      setError('NDR genel bakış verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchData();
  };
  
  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    dispatch(ndrActions.setTimeRange(newTimeRange));
  };
  
  // Handle view change
  const handleViewChange = (view: string) => {
    setSelectedView(view);
  };
  
  // Render system health status
  const renderSystemHealth = () => {
    if (!systemSummary || !systemSummary.health) return null;
    
    const { health } = systemSummary;
    const statusColor = 
      health.status === 'healthy' ? 'success' :
      health.status === 'degraded' ? 'warning' :
      health.status === 'critical' ? 'danger' : 'default';
    
    return (
      <div className="system-health">
        <div className="health-header">
          <h3>Sistem Sağlığı</h3>
          <Badge color={statusColor} size="large">
            {health.status === 'healthy' ? 'Sağlıklı' :
             health.status === 'degraded' ? 'Kısmi Çalışıyor' :
             health.status === 'critical' ? 'Kritik' : 'Bilinmiyor'}
          </Badge>
        </div>
        
        <div className="health-metrics">
          <div className="metric">
            <span className="metric-label">Aktif Servisler</span>
            <span className="metric-value">{health.activeServices} / {health.totalServices}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Aktif Sensörler</span>
            <span className="metric-value">{health.activeSensors} / {health.totalSensors}</span>
          </div>
          <div className="metric">
            <span className="metric-label">CPU Kullanımı</span>
            <span className="metric-value">{health.cpuUsage}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Bellek Kullanımı</span>
            <span className="metric-value">{health.memoryUsage}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">Disk Kullanımı</span>
            <span className="metric-value">{health.diskUsage}%</span>
          </div>
        </div>
        
        {health.issues && health.issues.length > 0 && (
          <div className="health-issues">
            <h4>Aktif Sorunlar</h4>
            <ul>
              {health.issues.map((issue: any, index: number) => (
                <li key={index}>
                  <Badge color={issue.severity === 'critical' ? 'danger' : 
                           issue.severity === 'high' ? 'warning' : 'caution'}>
                    {issue.severity}
                  </Badge>
                  <span className="issue-message">{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  // Render system stats
  const renderSystemStats = () => {
    if (!systemSummary || !systemSummary.stats) return null;
    
    const { stats } = systemSummary;
    
    return (
      <div className="system-stats">
        <div className="stats-header">
          <h3>Performans İstatistikleri</h3>
          <span className="time-range">{timeRange}</span>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">İşlenen Trafik</div>
            <div className="stat-value">{stats.processedTraffic}</div>
            <div className="stat-trend">
              {stats.trafficTrend >= 0 ? '+' : ''}{stats.trafficTrend}% son {timeRange}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Algılanan Tehditler</div>
            <div className="stat-value">{stats.detectedThreats}</div>
            <div className="stat-trend">
              {stats.threatTrend >= 0 ? '+' : ''}{stats.threatTrend}% son {timeRange}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Engellenen Saldırılar</div>
            <div className="stat-value">{stats.blockedAttacks}</div>
            <div className="stat-trend">
              {stats.attackTrend >= 0 ? '+' : ''}{stats.attackTrend}% son {timeRange}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-title">Tespit Edilen Anomaliler</div>
            <div className="stat-value">{stats.detectedAnomalies}</div>
            <div className="stat-trend">
              {stats.anomalyTrend >= 0 ? '+' : ''}{stats.anomalyTrend}% son {timeRange}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="ndr-overview-page">
      <PageHeader
        title="NDR Genel Bakış"
        description="Ağ izleme ve tehdit tespit sistemi genel durum paneli"
        actions={
          <>
            <TimeRangeSelector
              value={timeRange}
              onChange={handleTimeRangeChange}
            />
            <Button
              variant="primary"
              onClick={handleRefresh}
              loading={loading}
              icon={<RefreshIcon />}
            >
              Yenile
            </Button>
          </>
        }
      />
      
      {loading && !systemSummary ? (
        <div className="loading-container">
          <Spinner size="large" />
          <p>NDR sistemi bilgileri yükleniyor...</p>
        </div>
      ) : error ? (
        <Alert 
          type="error" 
          title="Yükleme Hatası" 
          message={error}
          action={
            <Button variant="primary" onClick={handleRefresh}>
              Yeniden Dene
            </Button>
          }
        />
      ) : (
        <>
          <Tabs 
            value={selectedView} 
            onChange={handleViewChange}
            className="view-tabs"
          >
            <Tab value="summary" label="Genel Bakış" />
            <Tab value="services" label="Servisler" />
            <Tab value="sensors" label="Sensörler" />
            <Tab value="analytics" label="Analitik" />
          </Tabs>
          
          {selectedView === 'summary' && (
            <div className="summary-view">
              <div className="top-row">
                {renderSystemHealth()}
                {renderSystemStats()}
              </div>
              
              <Grid className="widgets-grid">
                <SecurityScoreWidget 
                  className="security-score-widget"
                  timeRange={timeRange}
                  autoRefresh={true}
                />
                
                <NDREventsWidget 
                  className="events-widget"
                  timeRange={timeRange}
                  autoRefresh={true}
                  refreshInterval={60000}
                  defaultTab="alerts"
                />
                
                <TopProtocolsChart 
                  className="protocols-widget"
                  timeRange={timeRange}
                  autoRefresh={true}
                />
                
                <ThreatIntelWidget 
                  className="threat-intel-widget"
                  timeRange={timeRange}
                  autoRefresh={true}
                />
              </Grid>
              
              <NetworkMapWidget 
                className="network-map-widget"
                timeRange={timeRange}
                autoRefresh={true}
              />
            </div>
          )}
          
          {selectedView === 'services' && (
            <div className="services-view">
              <NDRServiceStatusWidget 
                serviceStatus={serviceStatus.data}
                loading={serviceStatus.loading}
                lastUpdated={serviceStatus.lastUpdated}
                onRefresh={() => dispatch(ndrActions.fetchServiceStatus())}
                className="service-status-widget"
              />
              
              {/* Service specific metrics and details would go here */}
            </div>
          )}
          
          {selectedView === 'sensors' && (
            <div className="sensors-view">
              {/* Sensor deployment map and status would go here */}
              <Card title="Sensör Dağılımı ve Durumu" className="sensors-card">
                <p>Bu bölüm, ağınızdaki NDR sensörlerinin coğrafi dağılımını ve durumunu gösterir.</p>
              </Card>
            </div>
          )}
          
          {selectedView === 'analytics' && (
            <div className="analytics-view">
              {/* Advanced analytics and ML model status would go here */}
              <Card title="Analitik Performans Metrikleri" className="analytics-card">
                <p>Bu bölüm, NDR analitik motorlarının ve makine öğrenimi modellerinin performans metriklerini gösterir.</p>
              </Card>
            </div>
          )}
          
          {lastUpdated && (
            <div className="last-updated">
              Son güncelleme: {formatDate(lastUpdated)}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NDROverviewPage;
import React, { useState, useEffect } from 'react';
import { Card, Spinner, Button, Select, Tabs, Tab } from '@/components/ui';
import { MetricsIcon, RefreshIcon } from '@/components/icons';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { useTheme } from '@/hooks/useTheme';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';
import './NDRMetricsWidget.scss';

interface NDRMetricsWidgetProps {
  timeRange: TimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const NDRMetricsWidget: React.FC<NDRMetricsWidgetProps> = ({
  timeRange,
  autoRefresh = true,
  refreshInterval = 60000, // 1 dakika
  className = ''
}) => {
  const { theme } = useTheme();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('system');
  const [metricsType, setMetricsType] = useState<string>('cpu');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Prepare queries based on active tab and metrics type
  const getPrometheusQuery = (): string => {
    switch (activeTab) {
      case 'system':
        switch (metricsType) {
          case 'cpu':
            return 'avg by (instance) (irate(node_cpu_seconds_total{mode!="idle"}[5m]) * 100)';
          case 'memory':
            return 'node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes';
          case 'disk':
            return 'node_filesystem_avail_bytes{mountpoint="/"}';
          case 'network':
            return 'sum by (instance) (irate(node_network_receive_bytes_total[5m]))';
          default:
            return 'avg by (instance) (irate(node_cpu_seconds_total{mode!="idle"}[5m]) * 100)';
        }
      case 'zeek':
        return 'zeek_events_total';
      case 'suricata':
        return 'suricata_alert_total';
      case 'elasticsearch':
        return 'elasticsearch_indices_docs_count';
      case 'kafka':
        return 'kafka_consumergroup_lag';
      default:
        return 'avg by (instance) (irate(node_cpu_seconds_total{mode!="idle"}[5m]) * 100)';
    }
  };
  
  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        const query = getPrometheusQuery();
        const data = await NDRIntegrationService.getPrometheusMetrics(query, timeRange);
        
        setMetrics(data);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (err) {
        logger.error('Error fetching NDR metrics:', err);
        setError('Metrikler alınamadı. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
    
    if (autoRefresh) {
      const intervalId = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [timeRange, activeTab, metricsType, autoRefresh, refreshInterval]);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Reset metrics type for each tab
    switch (tab) {
      case 'system':
        setMetricsType('cpu');
        break;
      case 'zeek':
        setMetricsType('events');
        break;
      case 'suricata':
        setMetricsType('alerts');
        break;
      case 'elasticsearch':
        setMetricsType('documents');
        break;
      case 'kafka':
        setMetricsType('lag');
        break;
      default:
        setMetricsType('cpu');
    }
  };
  
  // Handle metrics type change
  const handleMetricsTypeChange = (value: string) => {
    setMetricsType(value);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    const query = getPrometheusQuery();
    NDRIntegrationService.getPrometheusMetrics(query, timeRange)
      .then(data => {
        setMetrics(data);
        setLastUpdated(new Date().toISOString());
        setError(null);
      })
      .catch(err => {
        logger.error('Error fetching NDR metrics:', err);
        setError('Metrikler alınamadı. Lütfen tekrar deneyin.');
      });
  };
  
  // Format time
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };
  
  // Format metrics data for charts
  const formatChartData = () => {
    if (!metrics || !metrics.data || !metrics.data.result || metrics.data.result.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const result = metrics.data.result[0];
    const values = result.values || [];
    
    return {
      labels: values.map((v: any) => formatTime(v[0])),
      datasets: [
        {
          label: getMetricsLabel(),
          data: values.map((v: any) => parseFloat(v[1])),
          borderColor: theme === 'dark' ? '#00BCD4' : '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)'
        }
      ]
    };
  };
  
  // Get metrics label
  const getMetricsLabel = (): string => {
    switch (activeTab) {
      case 'system':
        switch (metricsType) {
          case 'cpu':
            return 'CPU Kullanımı (%)';
          case 'memory':
            return 'Bellek Kullanımı (Bytes)';
          case 'disk':
            return 'Disk Alanı (Bytes)';
          case 'network':
            return 'Ağ Trafiği (Bytes/s)';
          default:
            return 'CPU Kullanımı (%)';
        }
      case 'zeek':
        return 'Zeek Olayları';
      case 'suricata':
        return 'Suricata Uyarıları';
      case 'elasticsearch':
        return 'Elasticsearch Dokümanları';
      case 'kafka':
        return 'Kafka Consumer Lag';
      default:
        return 'Metrikler';
    }
  };
  
  // Render metrics options based on active tab
  const renderMetricsOptions = () => {
    switch (activeTab) {
      case 'system':
        return [
          { value: 'cpu', label: 'CPU Kullanımı' },
          { value: 'memory', label: 'Bellek Kullanımı' },
          { value: 'disk', label: 'Disk Kullanımı' },
          { value: 'network', label: 'Ağ Trafiği' }
        ];
      case 'zeek':
        return [
          { value: 'events', label: 'Olay Sayısı' },
          { value: 'logs', label: 'Log Boyutu' },
          { value: 'connections', label: 'Bağlantılar' }
        ];
      case 'suricata':
        return [
          { value: 'alerts', label: 'Uyarılar' },
          { value: 'events', label: 'Olaylar' },
          { value: 'drops', label: 'Paket Kayıpları' }
        ];
      case 'elasticsearch':
        return [
          { value: 'documents', label: 'Doküman Sayısı' },
          { value: 'indices', label: 'Index Sayısı' },
          { value: 'size', label: 'Depolama Boyutu' }
        ];
      case 'kafka':
        return [
          { value: 'lag', label: 'Consumer Lag' },
          { value: 'throughput', label: 'Throughput' },
          { value: 'offsets', label: 'Offsets' }
        ];
      default:
        return [
          { value: 'cpu', label: 'CPU Kullanımı' }
        ];
    }
  };
  
  return (
    <Card 
      className={`ndr-metrics-widget ${theme} ${className}`}
      title="NDR Sistem Metrikleri"
      titleIcon={<MetricsIcon />}
      actions={
        <>
          <Select
            value={metricsType}
            onChange={handleMetricsTypeChange}
            options={renderMetricsOptions()}
            label="Metrik"
          />
          
          <Button 
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="icon"
            aria-label="Yenile"
            title="Yenile"
            loading={loading}
          />
        </>
      }
    >
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab value="system" label="Sistem" />
        <Tab value="zeek" label="Zeek" />
        <Tab value="suricata" label="Suricata" />
        <Tab value="elasticsearch" label="Elasticsearch" />
        <Tab value="kafka" label="Kafka" />
      </Tabs>
      
      {loading && !metrics ? (
        <div className="ndr-metrics-widget__loading">
          <Spinner size="medium" />
          <p>Metrikler yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="ndr-metrics-widget__error">
          <p>{error}</p>
          <Button onClick={handleRefresh} variant="primary" size="small">
            Yeniden Dene
          </Button>
        </div>
      ) : !metrics || !metrics.data || !metrics.data.result || metrics.data.result.length === 0 ? (
        <div className="ndr-metrics-widget__empty">
          <p>Metrik verisi bulunamadı.</p>
        </div>
      ) : (
        <div className="ndr-metrics-widget__chart">
          <LineChart 
            data={formatChartData()} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  grid: {
                    display: false
                  }
                },
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true
                }
              }
            }}
            height={200}
          />
          
          {lastUpdated && (
            <div className="ndr-metrics-widget__updated">
              Son güncelleme: {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default NDRMetricsWidget;
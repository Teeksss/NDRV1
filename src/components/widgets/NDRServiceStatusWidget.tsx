import React from 'react';
import { Card, Badge, Button, Spinner, Tooltip } from '@/components/ui';
import { ServerIcon, RefreshIcon, InfoIcon } from '@/components/icons';
import { formatDate } from '@/utils/formatters';
import { useTheme } from '@/hooks/useTheme';
import './NDRServiceStatusWidget.scss';

interface ServiceStatus {
  status: 'running' | 'stopped' | 'error' | 'unknown';
  uptime?: number;
  lastRestart?: string;
  info?: string;
  version?: string;
  message?: string;
}

interface ServiceStatuses {
  zeek: ServiceStatus;
  suricata: ServiceStatus;
  arkime: ServiceStatus;
  elasticsearch: ServiceStatus;
  logstash: ServiceStatus;
  kibana: ServiceStatus;
  kafka: ServiceStatus;
  redis: ServiceStatus;
  prometheus: ServiceStatus;
  grafana: ServiceStatus;
}

interface NDRServiceStatusWidgetProps {
  serviceStatus: ServiceStatuses | null;
  loading: boolean;
  error?: string | null;
  lastUpdated: string | null;
  onRefresh: () => void;
  className?: string;
}

const NDRServiceStatusWidget: React.FC<NDRServiceStatusWidgetProps> = ({
  serviceStatus,
  loading,
  error,
  lastUpdated,
  onRefresh,
  className = ''
}) => {
  const { theme } = useTheme();
  
  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'default';
      case 'error':
        return 'danger';
      default:
        return 'warning';
    }
  };
  
  // Format uptime
  const formatUptime = (uptime: number): string => {
    const days = Math.floor(uptime / (3600 * 24));
    const hours = Math.floor((uptime % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) {
      return `${days}g ${hours}s ${minutes}d`;
    } else if (hours > 0) {
      return `${hours}s ${minutes}d`;
    } else {
      return `${minutes}d`;
    }
  };
  
  // Services group
  const serviceGroups = [
    {
      title: 'Trafik Analizi',
      services: ['zeek', 'suricata', 'arkime']
    },
    {
      title: 'Veri Depolama ve Analiz',
      services: ['elasticsearch', 'logstash', 'kibana']
    },
    {
      title: 'Mesajlaşma ve Önbellek',
      services: ['kafka', 'redis']
    },
    {
      title: 'İzleme ve Metrikler',
      services: ['prometheus', 'grafana']
    }
  ];
  
  return (
    <Card 
      className={`ndr-service-status-widget ${theme} ${className}`}
      title="NDR Servisleri Durumu"
      titleIcon={<ServerIcon />}
      actions={
        <>
          <Button 
            icon={<RefreshIcon />}
            onClick={onRefresh}
            variant="icon"
            aria-label="Servisleri Yenile"
            title="Yenile"
            loading={loading}
          />
        </>
      }
    >
      {loading && !serviceStatus ? (
        <div className="ndr-service-status-widget__loading">
          <Spinner size="medium" />
          <p>Servis durumları yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="ndr-service-status-widget__error">
          <p>{error}</p>
          <Button onClick={onRefresh} variant="primary" size="small">
            Yeniden Dene
          </Button>
        </div>
      ) : !serviceStatus ? (
        <div className="ndr-service-status-widget__empty">
          <p>Servis durumu bilgisi bulunamadı.</p>
          <Button onClick={onRefresh} variant="primary" size="small">
            Yeniden Dene
          </Button>
        </div>
      ) : (
        <>
          <div className="ndr-service-status-widget__groups">
            {serviceGroups.map((group) => (
              <div key={group.title} className="ndr-service-status-widget__group">
                <h4 className="ndr-service-status-widget__group-title">{group.title}</h4>
                <div className="ndr-service-status-widget__services">
                  {group.services.map((serviceKey) => {
                    const service = serviceStatus[serviceKey as keyof ServiceStatuses];
                    
                    return (
                      <div key={serviceKey} className="ndr-service-status-widget__service">
                        <div className="ndr-service-status-widget__service-name">
                          {serviceKey}
                          {service.version && <span className="version">{service.version}</span>}
                        </div>
                        <div className="ndr-service-status-widget__service-status">
                          <Badge color={getStatusColor(service.status)}>
                            {service.status === 'running' ? 'Çalışıyor' : 
                             service.status === 'stopped' ? 'Durduruldu' : 
                             service.status === 'error' ? 'Hata' : 'Bilinmiyor'}
                          </Badge>
                          
                          {service.info && (
                            <Tooltip content={service.info}>
                              <InfoIcon className="info-icon" />
                            </Tooltip>
                          )}
                        </div>
                        {service.uptime && service.status === 'running' && (
                          <div className="ndr-service-status-widget__service-uptime">
                            {formatUptime(service.uptime)}
                          </div>
                        )}
                        {service.message && (
                          <div className="ndr-service-status-widget__service-message">
                            {service.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {lastUpdated && (
            <div className="ndr-service-status-widget__updated">
              Son güncelleme: {formatDate(lastUpdated)}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default NDRServiceStatusWidget;
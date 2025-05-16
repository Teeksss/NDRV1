import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, Tabs, Tab, Table, Badge, Button, Spinner, Select, Tooltip, SearchInput } from '@/components/ui';
import { WarningIcon, DownloadIcon, FilterIcon, RefreshIcon, InfoIcon } from '@/components/icons';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { useTheme } from '@/hooks/useTheme';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';
import './NDREventsWidget.scss';

interface NDREventsWidgetProps {
  timeRange: TimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultTab?: string;
  onEventClick?: (event: any) => void;
  className?: string;
}

const NDREventsWidget: React.FC<NDREventsWidgetProps> = ({
  timeRange,
  autoRefresh = true,
  refreshInterval = 30000, // 30 saniye
  defaultTab = 'alerts',
  onEventClick,
  className = ''
}) => {
  const { theme } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data: any[] = [];
      
      switch (activeTab) {
        case 'alerts':
          // Suricata alerts
          const alerts = await NDRIntegrationService.getSuricataAlerts(
            timeRange,
            severityFilter === 'all' ? undefined : parseInt(severityFilter),
            100
          );
          data = alerts;
          break;
          
        case 'zeek':
          // Zeek events
          const zeekEvents = await NDRIntegrationService.getZeekEvents(timeRange, 100);
          data = zeekEvents;
          break;
          
        case 'sessions':
          // Arkime sessions
          const query = searchQuery ? searchQuery : undefined;
          const sessions = await NDRIntegrationService.getArkimeSessions(timeRange, query, 100);
          data = sessions;
          break;
          
        default:
          data = [];
      }
      
      // Filter by source if needed
      if (sourceFilter !== 'all') {
        data = data.filter(item => item.source === sourceFilter);
      }
      
      // Apply search filter if needed
      if (searchQuery) {
        data = data.filter(item => {
          const searchLower = searchQuery.toLowerCase();
          return (
            (item.source_ip && item.source_ip.includes(searchLower)) ||
            (item.destination_ip && item.destination_ip.includes(searchLower)) ||
            (item.signature && item.signature.toLowerCase().includes(searchLower)) ||
            (item.message && item.message.toLowerCase().includes(searchLower)) ||
            (item.host && item.host.toLowerCase().includes(searchLower))
          );
        });
      }
      
      // Sort by timestamp
      data.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.ts).getTime();
        const dateB = new Date(b.timestamp || b.ts).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
      
      setEvents(data);
    } catch (err) {
      logger.error('Error fetching NDR events:', err);
      setError('Olaylar alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeRange, searchQuery, severityFilter, sourceFilter, sortOrder]);
  
  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const intervalId = setInterval(fetchData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, autoRefresh, refreshInterval]);
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSeverityFilter('all');
    setSourceFilter('all');
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchData();
  };
  
  // Handle search
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };
  
  // Handle PCAP download
  const handleDownloadPcap = async (sessionId: string) => {
    try {
      const pcapBlob = await NDRIntegrationService.downloadPcap(sessionId);
      
      // Create a download link
      const url = window.URL.createObjectURL(pcapBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `session_${sessionId}.pcap`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error downloading PCAP:', err);
      // Show an error notification (implementation depends on your UI library)
    }
  };
  
  // Get severity badge color
  const getSeverityColor = (severity: number | string): string => {
    const sevNum = typeof severity === 'string' ? parseInt(severity) : severity;
    
    switch (sevNum) {
      case 1:
        return 'danger';
      case 2:
        return 'warning';
      case 3:
        return 'caution';
      default:
        return 'info';
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      if (!timestamp) return 'N/A';
      
      // Handle UNIX timestamps (Zeek format)
      if (typeof timestamp === 'number' || !isNaN(Number(timestamp))) {
        return format(new Date(Number(timestamp) * 1000), 'yyyy-MM-dd HH:mm:ss');
      }
      
      // Handle ISO string
      return format(parseISO(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch (err) {
      return timestamp;
    }
  };
  
  // Render table columns based on active tab
  const renderColumns = () => {
    switch (activeTab) {
      case 'alerts':
        return [
          { id: 'timestamp', header: 'Zaman', cell: (row: any) => formatTimestamp(row.timestamp) },
          { 
            id: 'severity', 
            header: 'Önem', 
            cell: (row: any) => (
              <Badge color={getSeverityColor(row.severity)}>
                {row.severity === 1 ? 'Kritik' : 
                 row.severity === 2 ? 'Yüksek' : 
                 row.severity === 3 ? 'Orta' : 'Düşük'}
              </Badge>
            )
          },
          { id: 'signature', header: 'İmza', cell: (row: any) => row.signature || 'N/A' },
          { id: 'source_ip', header: 'Kaynak IP', cell: (row: any) => row.source_ip || row.src_ip || 'N/A' },
          { id: 'destination_ip', header: 'Hedef IP', cell: (row: any) => row.destination_ip || row.dest_ip || 'N/A' },
          { 
            id: 'actions', 
            header: 'İşlemler', 
            cell: (row: any) => (
              <div className="ndr-events-widget__actions">
                <Tooltip content="Detaylar">
                  <Button 
                    variant="icon" 
                    size="small"
                    icon={<InfoIcon />}
                    onClick={() => onEventClick && onEventClick(row)}
                  />
                </Tooltip>
              </div>
            ) 
          }
        ];
        
      case 'zeek':
        return [
          { id: 'ts', header: 'Zaman', cell: (row: any) => formatTimestamp(row.ts) },
          { id: 'log_type', header: 'Log Tipi', cell: (row: any) => row.log_type || 'N/A' },
          { id: 'source_ip', header: 'Kaynak IP', cell: (row: any) => row.source_ip || row.id?.orig_h || 'N/A' },
          { id: 'destination_ip', header: 'Hedef IP', cell: (row: any) => row.destination_ip || row.id?.resp_h || 'N/A' },
          { id: 'proto', header: 'Protokol', cell: (row: any) => row.proto || 'N/A' },
          { 
            id: 'service', 
            header: 'Servis', 
            cell: (row: any) => row.service ? <Badge color="info">{row.service}</Badge> : 'N/A' 
          },
          { 
            id: 'actions', 
            header: 'İşlemler', 
            cell: (row: any) => (
              <div className="ndr-events-widget__actions">
                <Tooltip content="Detaylar">
                  <Button 
                    variant="icon" 
                    size="small"
                    icon={<InfoIcon />}
                    onClick={() => onEventClick && onEventClick(row)}
                  />
                </Tooltip>
              </div>
            ) 
          }
        ];
        
      case 'sessions':
        return [
          { id: 'timestamp', header: 'Zaman', cell: (row: any) => formatTimestamp(row.timestamp || row.firstPacket) },
          { id: 'source_ip', header: 'Kaynak IP', cell: (row: any) => row.source_ip || row.srcIp || 'N/A' },
          { id: 'destination_ip', header: 'Hedef IP', cell: (row: any) => row.destination_ip || row.dstIp || 'N/A' },
          { id: 'protocol', header: 'Protokol', cell: (row: any) => row.protocol || 'N/A' },
          { 
            id: 'bytes', 
            header: 'Boyut', 
            cell: (row: any) => {
              const bytes = row.bytes || row.totBytes || 0;
              return bytes < 1024 
                ? `${bytes} B` 
                : bytes < 1024 * 1024 
                  ? `${(bytes / 1024).toFixed(2)} KB` 
                  : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            } 
          },
          { 
            id: 'actions', 
            header: 'İşlemler', 
            cell: (row: any) => (
              <div className="ndr-events-widget__actions">
                <Tooltip content="PCAP İndir">
                  <Button 
                    variant="icon" 
                    size="small"
                    icon={<DownloadIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPcap(row.id);
                    }}
                  />
                </Tooltip>
                <Tooltip content="Detaylar">
                  <Button 
                    variant="icon" 
                    size="small"
                    icon={<InfoIcon />}
                    onClick={() => onEventClick && onEventClick(row)}
                  />
                </Tooltip>
              </div>
            ) 
          }
        ];
        
      default:
        return [];
    }
  };
  
  return (
    <Card 
      className={`ndr-events-widget ${theme} ${className}`}
      title="NDR Olayları"
      titleIcon={<WarningIcon />}
      actions={
        <>
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Ara..."
            className="ndr-events-widget__search"
          />
          
          {activeTab === 'alerts' && (
            <Select
              value={severityFilter}
              onChange={(value) => setSeverityFilter(value)}
              label="Önem"
              options={[
                { value: 'all', label: 'Tümü' },
                { value: '1', label: 'Kritik' },
                { value: '2', label: 'Yüksek' },
                { value: '3', label: 'Orta' },
                { value: '4', label: 'Düşük' }
              ]}
              icon={<FilterIcon />}
            />
          )}
          
          <Select
            value={sourceFilter}
            onChange={(value) => setSourceFilter(value)}
            label="Kaynak"
            options={[
              { value: 'all', label: 'Tümü' },
              { value: 'suricata', label: 'Suricata' },
              { value: 'zeek', label: 'Zeek' },
              { value: 'custom', label: 'Özel Kurallar' }
            ]}
            icon={<FilterIcon />}
          />
          
          <Select
            value={sortOrder}
            onChange={(value) => setSortOrder(value as 'asc' | 'desc')}
            label="Sıralama"
            options={[
              { value: 'desc', label: 'En Yeni' },
              { value: 'asc', label: 'En Eski' }
            ]}
          />
          
          <Button 
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="icon"
            aria-label="Yenile"
            title="Yenile"
          />
        </>
      }
    >
      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tab value="alerts" label="Uyarılar" />
        <Tab value="zeek" label="Zeek Olayları" />
        <Tab value="sessions" label="Ağ Oturumları" />
      </Tabs>
      
      {loading && events.length === 0 ? (
        <div className="ndr-events-widget__loading">
          <Spinner size="medium" />
          <p>Olaylar yükleniyor...</p>
        </div>
      ) : error ? (
        <div className="ndr-events-widget__error">
          <p>{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Yeniden Dene
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="ndr-events-widget__empty">
          <p>Seçilen kriterlere uygun olay bulunamadı.</p>
        </div>
      ) : (
        <div className="ndr-events-widget__table-container">
          <Table
            columns={renderColumns()}
            data={events}
            onRowClick={(row) => onEventClick && onEventClick(row)}
            rowClassName="ndr-events-widget__row"
            hoverable
            striped
          />
        </div>
      )}
    </Card>
  );
};

export default NDREventsWidget;
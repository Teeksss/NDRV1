import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Select, Tooltip, SearchInput, ProgressBar } from '@/components/ui';
import { ShieldIcon, RefreshIcon, FilterIcon, InfoIcon, GlobeIcon } from '@/components/icons';
import { ThreatIntelligenceService } from '@/services/ThreatIntelligenceService';
import { useTheme } from '@/hooks/useTheme';
import { TimeRange } from '@/types/analytics';
import { formatDate } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import './ThreatIntelWidget.scss';

interface ThreatIntelWidgetProps {
  timeRange: TimeRange;
  threatData?: any;
  loading?: boolean;
  error?: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onThreatClick?: (threat: any) => void;
  detailed?: boolean;
  className?: string;
}

const ThreatIntelWidget: React.FC<ThreatIntelWidgetProps> = ({
  timeRange,
  threatData: propsThreatData,
  loading: propsLoading,
  error: propsError,
  autoRefresh = true,
  refreshInterval = 60000, // 1 dakika
  onThreatClick,
  detailed = false,
  className = ''
}) => {
  const { theme } = useTheme();
  
  // State
  const [indicators, setIndicators] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ioc');
  const [loading, setLoading] = useState<boolean>(propsLoading || false);
  const [error, setError] = useState<string | null>(propsError || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [threatStats, setThreatStats] = useState<any | null>(propsThreatData);
  
  // Fetch data if not provided via props
  useEffect(() => {
    if (propsThreatData) {
      setThreatStats(propsThreatData);
      return;
    }
    
    const fetchThreatStats = async () => {
      try {
        setLoading(true);
        const stats = await ThreatIntelligenceService.getStatistics(timeRange);
        setThreatStats(stats);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (err) {
        logger.error('Error fetching threat intelligence stats:', err);
        setError('Tehdit istihbaratı istatistikleri alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreatStats();
    
    if (autoRefresh) {
      const intervalId = setInterval(fetchThreatStats, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [propsThreatData, timeRange, autoRefresh, refreshInterval]);
  
  // Fetch threat indicators
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        const params: any = {
          timeRange,
          includeLowConfidence: confidenceFilter === 0
        };
        
        if (categoryFilter !== 'all') {
          params.categories = [categoryFilter];
        }
        
        if (confidenceFilter > 0) {
          params.confidenceMin = confidenceFilter;
        }
        
        if (sourceFilter !== 'all') {
          params.sources = [sourceFilter];
        }
        
        const data = await ThreatIntelligenceService.getThreatIndicators(params);
        
        // Apply search filter if needed
        let filteredData = data;
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          filteredData = data.filter(item => {
            return (
              (item.value && item.value.toLowerCase().includes(searchLower)) ||
              (item.description && item.description.toLowerCase().includes(searchLower))
            );
          });
        }
        
        // Sort by confidence or timestamp
        filteredData.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.confidence - b.confidence;
          } else {
            return b.confidence - a.confidence;
          }
        });
        
        setIndicators(filteredData);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (err) {
        logger.error('Error fetching threat indicators:', err);
        setError('Tehdit göstergeleri alınamadı.');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'ioc') {
      fetchIndicators();
    }
  }, [activeTab, timeRange, searchQuery, categoryFilter, confidenceFilter, sourceFilter, sortOrder]);
  
  // Handle refresh click
  const handleRefresh = () => {
    if (activeTab === 'ioc') {
      // Reset filters and fetch again
      setSearchQuery('');
      setCategoryFilter('all');
      setConfidenceFilter(0);
      setSourceFilter('all');
    } else {
      // Fetch stats again
      if (!propsThreatData) {
        ThreatIntelligenceService.getStatistics(timeRange)
          .then(stats => {
            setThreatStats(stats);
            setLastUpdated(new Date().toISOString());
            setError(null);
          })
          .catch(err => {
            logger.error('Error fetching threat intelligence stats:', err);
            setError('Tehdit istihbaratı istatistikleri alınamadı.');
          });
      }
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Get severity badge color
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'caution';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Get confidence rating text and color
  const getConfidenceRating = (confidence: number): { text: string; color: string } => {
    if (confidence >= 90) {
      return { text: 'Çok Yüksek', color: 'success' };
    } else if (confidence >= 70) {
      return { text: 'Yüksek', color: 'success' };
    } else if (confidence >= 50) {
      return { text: 'Orta', color: 'warning' };
    } else if (confidence >= 30) {
      return { text: 'Düşük', color: 'caution' };
    } else {
      return { text: 'Çok Düşük', color: 'danger' };
    }
  };
  
  // Render tab content
  const renderTabContent = () => {
    if (loading && !indicators.length && !threatStats) {
      return (
        <div className="threat-intel-widget__loading">
          <Spinner size="medium" />
          <p>Tehdit istihbaratı yükleniyor...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="threat-intel-widget__error">
          <p>{error}</p>
          <Button onClick={handleRefresh} variant="primary" size="small">
            Yeniden Dene
          </Button>
        </div>
      );
    }
    
    if (activeTab === 'ioc') {
      if (indicators.length === 0) {
        return (
          <div className="threat-intel-widget__empty">
            <p>Belirtilen kriterlere uygun tehdit göstergesi bulunamadı.</p>
          </div>
        );
      }
      
      return (
        <div className="threat-intel-widget__indicators">
          <Table
            columns={[
              { id: 'value', header: 'Değer', cell: (row) => row.value },
              { id: 'type', header: 'Tür', cell: (row) => row.type },
              { 
                id: 'severity', 
                header: 'Önem', 
                cell: (row) => (
                  <Badge color={getSeverityColor(row.severity)}>
                    {row.severity === 'critical' ? 'Kritik' : 
                     row.severity === 'high' ? 'Yüksek' : 
                     row.severity === 'medium' ? 'Orta' : 'Düşük'}
                  </Badge>
                ) 
              },
              { 
                id: 'confidence', 
                header: 'Güven', 
                cell: (row) => {
                  const { text, color } = getConfidenceRating(row.confidence);
                  return (
                    <div className="confidence-cell">
                      <ProgressBar 
                        value={row.confidence} 
                        max={100} 
                        color={color} 
                        showValue 
                        size="small" 
                      />
                      <span>{text}</span>
                    </div>
                  );
                } 
              },
              { id: 'source', header: 'Kaynak', cell: (row) => row.source },
              { id: 'lastSeen', header: 'Son Görülme', cell: (row) => formatDate(row.lastSeen) },
              { 
                id: 'actions', 
                header: 'İşlemler', 
                cell: (row) => (
                  <div className="table-actions">
                    <Tooltip content="Detaylar">
                      <Button 
                        variant="icon" 
                        size="small"
                        icon={<InfoIcon />}
                        onClick={() => onThreatClick && onThreatClick(row)}
                      />
                    </Tooltip>
                  </div>
                ) 
              }
            ]}
            data={indicators}
            className="indicators-table"
            onRowClick={(row) => onThreatClick && onThreatClick(row)}
          />
        </div>
      );
    } else if (activeTab === 'stats') {
      if (!threatStats) {
        return (
          <div className="threat-intel-widget__empty">
            <p>Tehdit istihbaratı istatistikleri bulunamadı.</p>
          </div>
        );
      }
      
      return (
        <div className="threat-intel-widget__stats">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{threatStats.totalIndicators || 0}</div>
              <div className="stat-label">Toplam Gösterge</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{threatStats.activeIndicators || 0}</div>
              <div className="stat-label">Aktif Gösterge</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{threatStats.newIndicators || 0}</div>
              <div className="stat-label">Yeni Gösterge</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{threatStats.sourcesCount || 0}</div>
              <div className="stat-label">Kaynak Sayısı</div>
            </div>
          </div>
          
          {threatStats.categoryCounts && (
            <div className="category-chart">
              <h4>Kategorilere Göre Göstergeler</h4>
              <div className="category-bars">
                {Object.entries(threatStats.categoryCounts).map(([category, count]: [string, any]) => (
                  <div key={category} className="category-bar">
                    <div className="category-name">{category}</div>
                    <ProgressBar 
                      value={count} 
                      max={threatStats.totalIndicators} 
                      color="primary" 
                      showValue 
                    />
                    <div className="category-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {threatStats.typeCounts && (
            <div className="type-distribution">
              <h4>Gösterge Türleri</h4>
              <div className="type-grid">
                {Object.entries(threatStats.typeCounts).map(([type, count]: [string, any]) => (
                  <div key={type} className="type-item">
                    <div className="type-name">{type}</div>
                    <div className="type-count">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {threatStats.recentUpdates && (
            <div className="recent-updates">
              <h4>Son Güncellemeler</h4>
              <ul className="updates-list">
                {threatStats.recentUpdates.map((update: any, index: number) => (
                  <li key={index} className="update-item">
                    <span className="update-time">{formatDate(update.timestamp)}</span>
                    <span className="update-source">{update.source}</span>
                    <span className="update-message">{update.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Card 
      className={`threat-intel-widget ${theme} ${detailed ? 'detailed' : ''} ${className}`}
      title="Tehdit İstihbaratı"
      titleIcon={<ShieldIcon />}
      actions={
        <>
          {activeTab === 'ioc' && (
            <>
              <SearchInput
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                placeholder="Ara..."
                className="threat-intel-widget__search"
              />
              
              <Select
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                label="Kategori"
                options={[
                  { value: 'all', label: 'Tüm Kategoriler' },
                  { value: 'malware', label: 'Malware' },
                  { value: 'phishing', label: 'Phishing' },
                  { value: 'c2', label: 'C2' },
                  { value: 'ransomware', label: 'Ransomware' },
                  { value: 'apt', label: 'APT' }
                ]}
                icon={<FilterIcon />}
              />
              
              <Select
                value={confidenceFilter.toString()}
                onChange={(value) => setConfidenceFilter(parseInt(value))}
                label="Güven"
                options={[
                  { value: '0', label: 'Tümü' },
                  { value: '90', label: 'Çok Yüksek (90+)' },
                  { value: '70', label: 'Yüksek (70+)' },
                  { value: '50', label: 'Orta (50+)' },
                  { value: '30', label: 'Düşük (30+)' }
                ]}
                icon={<FilterIcon />}
              />
            </>
          )}
          
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
      tabs={[
        { id: 'ioc', label: 'Tehdit Göstergeleri', onClick: () => handleTabChange('ioc') },
        { id: 'stats', label: 'İstatistikler', onClick: () => handleTabChange('stats') }
      ]}
      activeTab={activeTab}
    >
      {renderTabContent()}
      
      {lastUpdated && (
        <div className="threat-intel-widget__updated">
          Son güncelleme: {formatDate(lastUpdated)}
        </div>
      )}
    </Card>
  );
};

export default ThreatIntelWidget;
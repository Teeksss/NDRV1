import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, Spinner, Select, Button, Tooltip, Badge, Menu, Dropdown, Modal, SearchInput } from '@/components/ui';
import { MapIcon, FilterIcon, RefreshIcon, ZoomInIcon, ZoomOutIcon, DownloadIcon, ExpandIcon, SettingsIcon } from '@/components/icons';
import { NetworkMapService } from '@/services/NetworkMapService';
import { DeviceService } from '@/services/DeviceService';
import { AlertService } from '@/services/AlertService';
import { NetworkMap, NetworkNode, NetworkLink, DeviceType } from '@/models/Network';
import { useTheme } from '@/hooks/useTheme';
import { useWindowSize } from '@/hooks/useWindowSize';
import { usePermissions } from '@/hooks/usePermissions';
import { TimeRange } from '@/types/analytics';
import { networkActions } from '@/store/network/actions';
import { RootState } from '@/store/types';
import { ndrConfig } from '@/config/app.config';
import { formatBytes, formatDate } from '@/utils/formatters';
import { logger } from '@/utils/logger';
import './NetworkMapWidget.scss';

interface NetworkMapWidgetProps {
  selectedDevices?: string[];
  onDeviceSelect?: (deviceIds: string[]) => void;
  timeRange?: TimeRange;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const NetworkMapWidget: React.FC<NetworkMapWidgetProps> = ({
  selectedDevices = [],
  onDeviceSelect,
  timeRange = '24h',
  autoRefresh = true,
  refreshInterval = 120000, // 2 dakika
  className = '',
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { width, height } = useWindowSize();
  const { hasPermission } = usePermissions();
  const graphRef = useRef<any>(null);
  
  // Redux selectors
  const {
    networkMap,
    deviceTypes,
    loadingMap,
    mapError,
    lastUpdated
  } = useSelector((state: RootState) => state.network);
  
  // State
  const [layout, setLayout] = useState<string>(ndrConfig.networkMap.layoutAlgorithm);
  const [mapData, setMapData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [showDeviceDetailsModal, setShowDeviceDetailsModal] = useState<boolean>(false);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredNodeTypes, setFilteredNodeTypes] = useState<string[]>([]);
  const [filteredNodeStatuses, setFilteredNodeStatuses] = useState<string[]>([]);
  
  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const fetchData = () => {
      loadNetworkMapData();
    };
    
    fetchData();
    const intervalId = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, timeRange, selectedDevices, layout]);
  
  // Set up initial data
  useEffect(() => {
    if (!deviceTypes.length) {
      dispatch(networkActions.fetchDeviceTypes());
    }
  }, [dispatch]);
  
  // Transform network map data for the graph library
  useEffect(() => {
    if (!networkMap) return;
    
    try {
      // Derinlik kopyası yaparak yeni bir obje oluştur
      const nodes = networkMap.nodes
        .filter(node => 
          (!filteredNodeTypes.length || filteredNodeTypes.includes(node.type)) &&
          (!filteredNodeStatuses.length || filteredNodeStatuses.includes(node.status)) &&
          (!searchQuery || 
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            node.ipAddresses.some(ip => ip.includes(searchQuery)))
        )
        .map(node => ({
          ...node,
          id: node.id,
          name: node.name,
          val: getNodeSize(node),
          color: getNodeColor(node),
          selected: selectedDevices.includes(node.id),
          highlighted: highlightNodes.has(node.id)
        }));
      
      const links = networkMap.links
        .filter(link => 
          nodes.some(node => node.id === link.source) && 
          nodes.some(node => node.id === link.target)
        )
        .map(link => ({
          ...link,
          id: link.id,
          source: link.source,
          target: link.target,
          color: getLinkColor(link),
          width: getLinkWidth(link),
          highlighted: highlightLinks.has(link.id)
        }));
      
      setMapData({ nodes, links });
    } catch (error) {
      logger.error('Error transforming network map data:', error);
    }
  }, [networkMap, selectedDevices, highlightNodes, highlightLinks, filteredNodeTypes, filteredNodeStatuses, searchQuery]);
  
  // Load network map data
  const loadNetworkMapData = async () => {
    try {
      // Seçili cihazlar varsa, ilgili cihazlar etrafında harita oluştur
      if (selectedDevices.length === 1) {
        dispatch(networkActions.fetchDeviceNetworkMap({
          deviceId: selectedDevices[0],
          depth: 2
        }));
      } else {
        dispatch(networkActions.fetchNetworkMap({
          timeRange,
          deviceIds: selectedDevices.length > 1 ? selectedDevices : undefined,
          layout: layout as any,
          details: 'standard'
        }));
      }
    } catch (error) {
      logger.error('Failed to load network map data:', error);
    }
  };
  
  // Handle node click
  const handleNodeClick = (node: any) => {
    if (!node) return;
    
    setSelectedNode(node);
    
    // İlgili bağlantı ve düğümleri vurgula
    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();
    
    newHighlightNodes.add(node.id);
    
    // Bu düğümle ilgili bağlantıları ve bağlı düğümleri bul
    if (networkMap) {
      networkMap.links.forEach(link => {
        if (link.source === node.id || link.target === node.id) {
          newHighlightLinks.add(link.id);
          newHighlightNodes.add(link.source === node.id ? link.target : link.source);
        }
      });
    }
    
    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    
    // Cihaz seçimi callback
    if (onDeviceSelect) {
      onDeviceSelect([node.id]);
    }
  };
  
  // Handle node hover
  const handleNodeHover = (node: any) => {
    setHoveredNode(node || null);
    
    if (!graphRef.current) return;
    
    // İmleç stilini güncelle
    graphRef.current.d3Force('link').links().forEach((link: any) => {
      link.__lineObj.style.cursor = node ? 'pointer' : null;
    });
    
    graphRef.current.d3Force('node').nodes().forEach((n: any) => {
      n.__circleObj.style.cursor = node ? 'pointer' : null;
    });
  };
  
  // Reset highlights
  const resetHighlights = () => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    setSelectedNode(null);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadNetworkMapData();
    dispatch(networkActions.fetchDeviceTypes());
  };
  
  // Handle layout change
  const handleLayoutChange = (value: string) => {
    setLayout(value);
  };
  
  // Toggle device details modal
  const toggleDeviceDetailsModal = () => {
    setShowDeviceDetailsModal(!showDeviceDetailsModal);
  };
  
  // Handle device type filter change
  const handleDeviceTypeFilterChange = (types: string[]) => {
    setFilteredNodeTypes(types);
  };
  
  // Handle device status filter change
  const handleDeviceStatusFilterChange = (statuses: string[]) => {
    setFilteredNodeStatuses(statuses);
  };
  
  // Handle zoom actions
  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.2, 400);
    }
  };
  
  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.2, 400);
    }
  };
  
  const handleZoomToFit = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 40);
    }
  };
  
  // Download map as PNG
  const handleDownloadImage = () => {
    if (!graphRef.current) return;
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `network-map-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };
  
  // Helper functions for node and link styling
  const getNodeSize = (node: NetworkNode): number => {
    if (selectedDevices.includes(node.id)) {
      return 10;
    }
    
    switch (node.category) {
      case 'network':
        return 8;
      case 'security':
        return 7;
      case 'server':
        return 6;
      case 'endpoint':
        return 5;
      default:
        return 4;
    }
  };
  
  const getNodeColor = (node: NetworkNode): string => {
    if (selectedDevices.includes(node.id)) {
      return '#ffcc00';
    }
    
    switch (node.status) {
      case 'critical':
        return '#e53935';
      case 'warning':
        return '#fb8c00';
      case 'inactive':
        return '#9e9e9e';
      case 'active':
        switch (node.category) {
          case 'network':
            return '#1e88e5';
          case 'security':
            return '#43a047';
          case 'server':
            return '#8e24aa';
          case 'endpoint':
            return '#00acc1';
          case 'iot':
            return '#ff8a65';
          default:
            return '#757575';
        }
      default:
        return '#757575';
    }
  };
  
  const getLinkColor = (link: NetworkLink): string => {
    switch (link.status) {
      case 'active':
        return theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';
      case 'degraded':
        return '#fb8c00';
      case 'failed':
        return '#e53935';
      case 'inactive':
        return theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      default:
        return theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    }
  };
  
  const getLinkWidth = (link: NetworkLink): number => {
    if (highlightLinks.has(link.id)) {
      return 3;
    }
    
    switch (link.status) {
      case 'active':
        return link.trafficVolume ? Math.max(0.5, Math.min(5, link.trafficVolume / 10000000)) : 1;
      case 'degraded':
        return 1;
      case 'failed':
        return 1;
      case 'inactive':
        return 0.5;
      default:
        return 1;
    }
  };
  
  // Custom node render function
  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    const nodeSize = node.val;
    
    // Draw node
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    
    // Draw border
    if (highlightNodes.has(node.id) || selectedDevices.includes(node.id)) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }
    
    // Draw label if zoom level is sufficient
    if (globalScale > 0.6) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = theme === 'dark' ? '#ffffff' : '#000000';
      ctx.fillText(label, node.x, node.y + nodeSize + 2);
    }
    
    // Draw status indicator
    if (node.status === 'critical' || node.status === 'warning') {
      ctx.beginPath();
      ctx.arc(node.x + nodeSize, node.y - nodeSize, nodeSize / 2, 0, 2 * Math.PI);
      ctx.fillStyle = node.status === 'critical' ? '#e53935' : '#fb8c00';
      ctx.fill();
    }
  };
  
  // Determine widget dimensions
  const graphHeight = isFullscreen 
    ? height - 120 
    : Math.min(400, height * 0.6);
  const graphWidth = isFullscreen 
    ? width - 40 
    : '100%';
  
  return (
    <Card 
      className={`network-map-widget ${theme} ${className}`}
      title="Ağ Haritası"
      titleIcon={<MapIcon />}
      actions={
        <>
          <SearchInput
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            placeholder="Cihaz ara..."
            className="network-map-widget__search"
          />
          
          <Dropdown
            trigger={
              <Button
                icon={<FilterIcon />}
                variant="icon"
                aria-label="Filtreleri Aç"
                title="Filtreler"
                onClick={() => setFiltersOpen(!filtersOpen)}
              />
            }
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          >
            <div className="network-map-widget__filters">
              <h4>Cihaz Tipleri</h4>
              {deviceTypes.map((type) => (
                <div key={type.id} className="network-map-widget__filter-item">
                  <input
                    type="checkbox"
                    id={`filter-type-${type.id}`}
                    checked={!filteredNodeTypes.length || filteredNodeTypes.includes(type.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilteredNodeTypes(
                          filteredNodeTypes.filter(t => t !== type.id)
                        );
                      } else {
                        setFilteredNodeTypes([...filteredNodeTypes, type.id]);
                      }
                    }}
                  />
                  <label htmlFor={`filter-type-${type.id}`}>{type.name}</label>
                </div>
              ))}
              
              <h4>Durum</h4>
              {['active', 'warning', 'critical', 'inactive'].map((status) => (
                <div key={status} className="network-map-widget__filter-item">
                  <input
                    type="checkbox"
                    id={`filter-status-${status}`}
                    checked={!filteredNodeStatuses.length || filteredNodeStatuses.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilteredNodeStatuses(
                          filteredNodeStatuses.filter(s => s !== status)
                        );
                      } else {
                        setFilteredNodeStatuses([...filteredNodeStatuses, status]);
                      }
                    }}
                  />
                  <label htmlFor={`filter-status-${status}`}>
                    {status === 'active' ? 'Aktif' : 
                     status === 'warning' ? 'Uyarı' : 
                     status === 'critical' ? 'Kritik' : 'Inaktif'}
                  </label>
                </div>
              ))}
              
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => {
                  setFilteredNodeTypes([]);
                  setFilteredNodeStatuses([]);
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </Dropdown>
          
          <Select
            value={layout}
            onChange={handleLayoutChange}
            label="Düzen"
            options={[
              { value: 'force-directed', label: 'Kuvvet-Tabanlı' },
              { value: 'radial', label: 'Dairesel' },
              { value: 'hierarchical', label: 'Hiyerarşik' }
            ]}
            className="network-map-widget__layout-select"
          />
          
          <Button 
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="icon"
            aria-label="Haritayı Yenile"
            title="Yenile"
          />
          
          {onToggleFullscreen && (
            <Button 
              icon={<ExpandIcon />}
              onClick={onToggleFullscreen}
              variant="icon"
              aria-label={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
              title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran"}
            />
          )}
        </>
      }
    >
      {loadingMap && !networkMap ? (
        <div className="network-map-widget__loading">
          <Spinner size="large" />
          <p>Ağ haritası yükleniyor...</p>
        </div>
      ) : mapError ? (
        <div className="network-map-widget__error">
          <p>{mapError}</p>
          <Button onClick={handleRefresh} variant="primary">
            Yeniden Dene
          </Button>
        </div>
      ) : (
        <div className="network-map-widget__content">
          <div className="network-map-widget__graph-container" style={{ height: graphHeight, width: graphWidth }}>
            <ForceGraph2D
              ref={graphRef}
              graphData={mapData}
              nodeLabel={(node: any) => `${node.name} (${node.ipAddresses[0] || 'Bilinmeyen IP'})`}
              linkLabel={(link: any) => `${link.type} bağlantı - ${link.status}`}
              nodeCanvasObject={nodeCanvasObject}
              linkWidth={(link) => link.width}
              linkColor={(link) => link.color}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              onBackgroundClick={resetHighlights}
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.01}
              linkDirectionalParticleColor={(link) => link.highlighted ? '#ffffff' : link.color}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              warmupTicks={50}
              nodeRelSize={6}
            />
            
            {/* Zoom Controls */}
            <div className="network-map-widget__zoom-controls">
              <Button 
                icon={<ZoomInIcon />}
                onClick={handleZoomIn}
                variant="icon"
                aria-label="Yakınlaştır"
                title="Yakınlaştır"
              />
              <Button 
                icon={<ZoomOutIcon />}
                onClick={handleZoomOut}
                variant="icon"
                aria-label="Uzaklaştır"
                title="Uzaklaştır"
              />
              <Button 
                icon={<ExpandIcon />}
                onClick={handleZoomToFit}
                variant="icon"
                aria-label="Haritayı Sığdır"
                title="Haritayı Sığdır"
              />
              <Button 
                icon={<DownloadIcon />}
                onClick={handleDownloadImage}
                variant="icon"
                aria-label="PNG Olarak İndir"
                title="PNG Olarak İndir"
              />
            </div>
            
            {/* Hover Info */}
            {hoveredNode && (
              <div 
                className="network-map-widget__hover-info"
                style={{ 
                  left: `${hoveredNode.x + 20}px`, 
                  top: `${hoveredNode.y - 20}px` 
                }}
              >
                <h4>{hoveredNode.name}</h4>
                <p>IP: {hoveredNode.ipAddresses[0] || 'Bilinmeyen'}</p>
                <p>Tip: {hoveredNode.type}</p>
                <p>
                  Durum: 
                  <Badge 
                    color={
                      hoveredNode.status === 'active' ? 'success' : 
                      hoveredNode.status === 'warning' ? 'warning' : 
                      hoveredNode.status === 'critical' ? 'danger' : 'default'
                    }
                  >
                    {hoveredNode.status === 'active' ? 'Aktif' : 
                     hoveredNode.status === 'warning' ? 'Uyarı' : 
                     hoveredNode.status === 'critical' ? 'Kritik' : 'Inaktif'}
                  </Badge>
                </p>
                {hoveredNode.alertCount > 0 && (
                  <p>Uyarılar: <Badge color="danger">{hoveredNode.alertCount}</Badge></p>
                )}
              </div>
            )}
          </div>
          
          {/* Selected Node Info */}
          {selectedNode && (
            <div className="network-map-widget__selected-info">
              <div className="network-map-widget__selected-header">
                <h3>{selectedNode.name}</h3>
                <div className="network-map-widget__selected-actions">
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={toggleDeviceDetailsModal}
                  >
                    Detayları Görüntüle
                  </Button>
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={resetHighlights}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
              
              <div className="network-map-widget__selected-details">
                <div>
                  <strong>IP:</strong> {selectedNode.ipAddresses.join(', ')}
                </div>
                <div>
                  <strong>Tip:</strong> {selectedNode.type}
                </div>
                <div>
                  <strong>MAC:</strong> {selectedNode.macAddress || 'Bilinmeyen'}
                </div>
                <div>
                  <strong>Durum:</strong> 
                  <Badge 
                    color={
                      selectedNode.status === 'active' ? 'success' : 
                      selectedNode.status === 'warning' ? 'warning' : 
                      selectedNode.status === 'critical' ? 'danger' : 'default'
                    }
                  >
                    {selectedNode.status === 'active' ? 'Aktif' : 
                     selectedNode.status === 'warning' ? 'Uyarı' : 
                     selectedNode.status === 'critical' ? 'Kritik' : 'Inaktif'}
                  </Badge>
                </div>
                {selectedNode.metrics && (
                  <>
                    {selectedNode.metrics.trafficIn !== undefined && (
                      <div>
                        <strong>Gelen Trafik:</strong> {formatBytes(selectedNode.metrics.trafficIn)}/s
                      </div>
                    )}
                    {selectedNode.metrics.trafficOut !== undefined && (
                      <div>
                        <strong>Giden Trafik:</strong> {formatBytes(selectedNode.metrics.trafficOut)}/s
                      </div>
                    )}
                  </>
                )}
                <div>
                  <strong>Son Görülme:</strong> {formatDate(selectedNode.lastSeen)}
                </div>
              </div>
            </div>
          )}
          
          {/* Network Map Stats */}
          {networkMap && (
            <div className="network-map-widget__stats">
              <div>
                Toplam: <strong>{networkMap.statistics.totalNodes}</strong> cihaz,
                <strong>{networkMap.statistics.totalLinks}</strong> bağlantı
              </div>
              <div>
                Son Güncelleme: <strong>{formatDate(lastUpdated || '')}</strong>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Device Details Modal */}
      {selectedNode && (
        <Modal
          isOpen={showDeviceDetailsModal}
          onClose={toggleDeviceDetailsModal}
          title={`Cihaz Detayları: ${selectedNode.name}`}
          size="large"
        >
          {/* Cihaz detay içeriği burada olacak */}
          <div className="network-map-widget__device-details">
            {/* Detaylı cihaz bilgileri burada görüntülenecek */}
            <p>Bu modal, seçilen cihaz hakkında daha detaylı bilgileri gösterecektir.</p>
          </div>
        </Modal>
      )}
    </Card>
  );
};

export default NetworkMapWidget;
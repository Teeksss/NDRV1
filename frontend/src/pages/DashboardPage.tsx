import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Refresh,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  FullscreenExit,
  Fullscreen
} from '@mui/icons-material';
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { DashboardService } from '../services/DashboardService';
import { AlertService } from '../services/AlertService';
import { NetworkService } from '../services/NetworkService';
import { EventService } from '../services/EventService';
import StatusCard from '../components/dashboard/StatusCard';
import DashboardWidget from '../components/dashboard/DashboardWidget';
import MetricsChart from '../components/charts/MetricsChart';
import ThreatVisualization from '../components/visualization/ThreatVisualization';
import NetworkTopologyMap from '../components/visualization/NetworkTopologyMap';
import AlertSeverityPieChart from '../components/charts/AlertSeverityPieChart';
import { formatNumber } from '../utils/formatters';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { settings } = useSettings();
  
  // Services
  const dashboardService = new DashboardService();
  const alertService = new AlertService();
  const networkService = new NetworkService();
  const eventService = new EventService();
  
  // State
  const [widgets, setWidgets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    alerts: { count: 0, change: 0, loading: true, error: null },
    events: { count: 0, change: 0, loading: true, error: null },
    entities: { count: 0, change: 0, loading: true, error: null },
    traffic: { count: 0, change: 0, loading: true, error: null }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [widgetMenuAnchorEl, setWidgetMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeWidget, setActiveWidget] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Responsive grid breakpoints
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  
  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);
  
  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Load widgets
      const userWidgets = await dashboardService.getUserWidgets();
      setWidgets(userWidgets);
      
      // Load summary metrics in parallel
      await Promise.all([
        loadAlertSummary(),
        loadEventSummary(),
        loadEntitySummary(),
        loadTrafficSummary()
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };
  
  // Load alert summary
  const loadAlertSummary = async () => {
    try {
      setSummary(prev => ({
        ...prev,
        alerts: { ...prev.alerts, loading: true, error: null }
      }));
      
      const data = await alertService.getAlertsBySeverity(timeRange);
      
      const total = Object.values(data).reduce((sum: any, value: any) => sum + value, 0);
      
      // Calculate change percentage (in a real app, this would come from the backend)
      const change = Math.floor(Math.random() * 40) - 20; // -20 to +20 for demo
      
      setSummary(prev => ({
        ...prev,
        alerts: { count: total, change, loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error loading alert summary:', error);
      setSummary(prev => ({
        ...prev,
        alerts: { ...prev.alerts, loading: false, error: 'Failed to load alert data' }
      }));
    }
  };
  
  // Load event summary
  const loadEventSummary = async () => {
    try {
      setSummary(prev => ({
        ...prev,
        events: { ...prev.events, loading: true, error: null }
      }));
      
      const data = await eventService.getEventStatistics(timeRange);
      
      // Calculate change percentage (in a real app, this would come from the backend)
      const change = Math.floor(Math.random() * 30) - 10; // -10 to +20 for demo
      
      setSummary(prev => ({
        ...prev,
        events: { count: data.total, change, loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error loading event summary:', error);
      setSummary(prev => ({
        ...prev,
        events: { ...prev.events, loading: false, error: 'Failed to load event data' }
      }));
    }
  };
  
  // Load entity summary
  const loadEntitySummary = async () => {
    try {
      setSummary(prev => ({
        ...prev,
        entities: { ...prev.entities, loading: true, error: null }
      }));
      
      const data = await dashboardService.getEntitySummary(timeRange);
      
      // Calculate change percentage (in a real app, this would come from the backend)
      const change = Math.floor(Math.random() * 10); // 0 to +10 for demo
      
      setSummary(prev => ({
        ...prev,
        entities: { count: data.total, change, loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error loading entity summary:', error);
      setSummary(prev => ({
        ...prev,
        entities: { ...prev.entities, loading: false, error: 'Failed to load entity data' }
      }));
    }
  };
  
  // Load traffic summary
  const loadTrafficSummary = async () => {
    try {
      setSummary(prev => ({
        ...prev,
        traffic: { ...prev.traffic, loading: true, error: null }
      }));
      
      const data = await networkService.getBandwidthUsage();
      
      // Calculate total bandwidth in GB
      const totalBandwidth = (data.totalInbound + data.totalOutbound) / (1024 * 1024 * 1024);
      
      // Calculate change percentage (in a real app, this would come from the backend)
      const change = Math.floor(Math.random() * 30) - 5; // -5 to +25 for demo
      
      setSummary(prev => ({
        ...prev,
        traffic: { count: totalBandwidth.toFixed(2), change, loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error loading traffic summary:', error);
      setSummary(prev => ({
        ...prev,
        traffic: { ...prev.traffic, loading: false, error: 'Failed to load traffic data' }
      }));
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadDashboardData();
  };
  
  // Handle time range menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle time range menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle time range selection
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    handleMenuClose();
  };
  
  // Handle widget menu open
  const handleWidgetMenuOpen = (event: React.MouseEvent<HTMLElement>, widget: any) => {
    event.stopPropagation();
    setWidgetMenuAnchorEl(event.currentTarget);
    setActiveWidget(widget);
  };
  
  // Handle widget menu close
  const handleWidgetMenuClose = () => {
    setWidgetMenuAnchorEl(null);
    setActiveWidget(null);
  };
  
  // Handle widget layout change
  const handleLayoutChange = (layout: any) => {
    if (isEditMode) {
      // Update widget positions only in edit mode
      const updatedWidgets = widgets.map(widget => {
        const layoutItem = layout.find((item: any) => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return widget;
      });
      
      setWidgets(updatedWidgets);
    }
  };
  
  // Save layout changes
  const saveLayoutChanges = async () => {
    try {
      await dashboardService.saveWidgetLayout(widgets);
      setNotification({ type: 'success', message: 'Dashboard layout saved successfully' });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      setNotification({ type: 'error', message: 'Failed to save dashboard layout' });
    }
  };
  
  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    if (isEditMode) {
      // Save changes when exiting edit mode
      saveLayoutChanges();
    } else {
      setIsEditMode(true);
    }
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(null);
  };
  
  // Handle widget fullscreen toggle
  const handleFullscreenToggle = (widgetId: string) => {
    if (fullscreenWidget === widgetId) {
      setFullscreenWidget(null);
    } else {
      setFullscreenWidget(widgetId);
    }
  };
  
  // Render dashboard content
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleMenuOpen}
            size="small"
          >
            {timeRange === '24h' ? 'Son 24 Saat' : 
              timeRange === '7d' ? 'Son 7 Gün' : 
              timeRange === '30d' ? 'Son 30 Gün' : 'Özel'}
          </Button>
          
          <Button
            color={isEditMode ? 'primary' : 'inherit'}
            variant={isEditMode ? 'contained' : 'outlined'}
            onClick={handleEditModeToggle}
            size="small"
          >
            {isEditMode ? 'Kaydet' : 'Düzenle'}
          </Button>
          
          <IconButton size="small" color="primary" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>
      
      {/* Time range menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleTimeRangeChange('24h')}>Son 24 Saat</MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('7d')}>Son 7 Gün</MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('30d')}>Son 30 Gün</MenuItem>
        <MenuItem onClick={() => handleTimeRangeChange('90d')}>Son 90 Gün</MenuItem>
      </Menu>
      
      {/* Summary cards */}
      {!fullscreenWidget && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatusCard
              title="Güvenlik Alarmları"
              value={formatNumber(summary.alerts.count)}
              change={summary.alerts.change}
              loading={summary.alerts.loading}
              error={summary.alerts.error}
              color="error"
              icon="alerts"
              onClick={() => {/* Navigate to alerts page */}}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatusCard
              title="Güvenlik Olayları"
              value={formatNumber(summary.events.count)}
              change={summary.events.change}
              loading={summary.events.loading}
              error={summary.events.error}
              color="warning"
              icon="events"
              onClick={() => {/* Navigate to events page */}}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatusCard
              title="Ağ Varlıkları"
              value={formatNumber(summary.entities.count)}
              change={summary.entities.change}
              loading={summary.entities.loading}
              error={summary.entities.error}
              color="info"
              icon="entities"
              onClick={() => {/* Navigate to entities page */}}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatusCard
              title="Toplam Trafik (GB)"
              value={summary.traffic.count.toString()}
              change={summary.traffic.change}
              loading={summary.traffic.loading}
              error={summary.traffic.error}
              color="success"
              icon="traffic"
              onClick={() => {/* Navigate to network page */}}
            />
          </Grid>
        </Grid>
      )}
      
      {/* Dashboard widgets */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRefresh}
          >
            Yeniden Dene
          </Button>
        </Paper>
      ) : (
        <Box sx={{ width: '100%' }}>
          {fullscreenWidget ? (
            // Fullscreen widget
            <Paper sx={{ p: 2, height: 'calc(100vh - 220px)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  {widgets.find(w => w.id === fullscreenWidget)?.title || 'Widget'}
                </Typography>
                <IconButton onClick={() => handleFullscreenToggle(fullscreenWidget)}>
                  <FullscreenExit />
                </IconButton>
              </Box>
              <Box sx={{ height: 'calc(100% - 50px)' }}>
                {/* Render fullscreen widget content */}
                {/* This would render the actual widget content based on widget type */}
              </Box>
            </Paper>
          ) : (
            // Grid layout
            <ResponsiveGridLayout
              className="layout"
              layouts={{
                lg: widgets.map(widget => ({
                  i: widget.id,
                  x: widget.position.x || 0,
                  y: widget.position.y || 0,
                  w: widget.position.w || 3,
                  h: widget.position.h || 3,
                  minW: 2,
                  minH: 2
                }))
              }}
              breakpoints={breakpoints}
              cols={cols}
              rowHeight={100}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              onLayoutChange={handleLayoutChange}
              margin={[16, 16]}
            >
              {widgets.map(widget => (
                <Paper key={widget.id} sx={{ height: '100%', overflow: 'hidden' }}>
                  <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}>
                    <Typography variant="h6">{widget.title}</Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleFullscreenToggle(widget.id)}
                      >
                        <Fullscreen fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => handleWidgetMenuOpen(e, widget)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    {/* Render widget content based on type */}
                    <DashboardWidget widget={widget} />
                  </Box>
                </Paper>
              ))}
            </ResponsiveGridLayout>
          )}
        </Box>
      )}
      
      {/* Widget menu */}
      <Menu
        anchorEl={widgetMenuAnchorEl}
        open={Boolean(widgetMenuAnchorEl)}
        onClose={handleWidgetMenuClose}
      >
        <MenuItem onClick={handleWidgetMenuClose}>Refresh</MenuItem>
        <MenuItem onClick={handleWidgetMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleWidgetMenuClose}>Remove</MenuItem>
      </Menu>
      
      {/* Notification */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert 
            onClose={handleNotificationClose} 
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
};

export default DashboardPage;
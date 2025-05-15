import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Dashboard,
  Security,
  NetworkCheck,
  Storage,
  Report,
  Search,
  Settings,
  MoreVert,
  ChevronLeft,
  Refresh,
  Add,
  FilterList
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardService } from '../../services/DashboardService';
import { AlertService } from '../../services/AlertService';
import { useAuth } from '../../hooks/useAuth';

// Components
import { TimeSeriesChart } from '../visualization/TimeSeriesChart';
import { ThreatVisualization } from '../visualization/ThreatVisualization';
import { NetworkTopologyMap } from '../visualization/NetworkTopologyMap';
import { AlertList } from '../alerts/AlertList';
import { EntityList } from '../entity/EntityList';
import { EventList } from '../events/EventList';
import { DashboardWidget } from './DashboardWidget';
import { StatusCard } from './StatusCard';
import { MobileDetailView } from './MobileDetailView';

const drawerWidth = 240;

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'alerts' | 'events' | 'metrics' | 'topology' | 'threats' | 'entityList' | 'status';
  width: 12 | 6 | 4 | 3;
  height: number;
  data?: any;
  config?: any;
}

export const ResponsiveDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [mobileDetailView, setMobileDetailView] = useState<{
    open: boolean;
    title: string;
    type: string;
    data: any;
  }>({
    open: false,
    title: '',
    type: '',
    data: null
  });
  
  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardService = new DashboardService();
      const alertService = new AlertService();
      
      // Get dashboard overview
      const overview = await dashboardService.getDashboardOverview();
      
      // Get recent alerts
      const recentAlerts = await alertService.getAlerts({
        limit: 10,
        sort: 'timestamp',
        order: 'desc'
      });
      
      // Get security dashboard
      const securityDashboard = await dashboardService.getSecurityDashboard();
      
      // Get network dashboard
      const networkDashboard = await dashboardService.getNetworkDashboard();
      
      // Combine data
      const combinedData = {
        overview,
        recentAlerts,
        securityDashboard,
        networkDashboard
      };
      
      setDashboardData(combinedData);
      
      // Set up widgets based on screen size
      const newWidgets = generateWidgets(combinedData);
      setWidgets(newWidgets);
      
      setLoading(false);
    } catch (err: any) {
      setError(`Failed to load dashboard: ${err.message}`);
      setLoading(false);
      console.error('Dashboard loading error:', err);
    }
  };
  
  // Generate widgets based on data and screen size
  const generateWidgets = (data: any): DashboardWidget[] => {
    const defaultWidgets: DashboardWidget[] = [];
    
    // Add status cards
    defaultWidgets.push({
      id: 'status-alerts',
      title: 'Alarms',
      type: 'status',
      width: isMobile ? 6 : isTablet ? 3 : 3,
      height: 120,
      data: {
        value: data.overview.alerts.total,
        change: data.overview.alerts.change,
        icon: 'warning',
        color: 'error'
      }
    });
    
    defaultWidgets.push({
      id: 'status-events',
      title: 'Events',
      type: 'status',
      width: isMobile ? 6 : isTablet ? 3 : 3,
      height: 120,
      data: {
        value: data.overview.events.total,
        change: data.overview.events.change,
        icon: 'notifications',
        color: 'primary'
      }
    });
    
    defaultWidgets.push({
      id: 'status-entities',
      title: 'Entities',
      type: 'status',
      width: isMobile ? 6 : isTablet ? 3 : 3,
      height: 120,
      data: {
        value: data.overview.entities.total,
        change: data.overview.entities.change,
        icon: 'devices',
        color: 'info'
      }
    });
    
    defaultWidgets.push({
      id: 'status-traffic',
      title: 'Traffic',
      type: 'status',
      width: isMobile ? 6 : isTablet ? 3 : 3,
      height: 120,
      data: {
        value: `${(data.networkDashboard.overview.totalMB / 1024).toFixed(2)} GB`,
        change: data.networkDashboard.overview.change,
        icon: 'network_check',
        color: 'success'
      }
    });
    
    // Add alert widget
    defaultWidgets.push({
      id: 'recent-alerts',
      title: 'Recent Alerts',
      type: 'alerts',
      width: isMobile ? 12 : isTablet ? 12 : 6,
      height: 320,
      data: {
        alerts: data.recentAlerts
      }
    });
    
    // Add threat visualization
    defaultWidgets.push({
      id: 'threat-visualization',
      title: 'Threat Map',
      type: 'threats',
      width: isMobile ? 12 : isTablet ? 12 : 6,
      height: 320,
      config: {
        showWorldMap: true,
        showTimeline: false,
        showThreatTypes: false
      }
    });
    
    // Add network topology for non-mobile
    if (!isMobile) {
      defaultWidgets.push({
        id: 'network-topology',
        title: 'Network Topology',
        type: 'topology',
        width: isTablet ? 12 : 6,
        height: 400,
        config: {
          refreshInterval: 60000
        }
      });
    }
    
    // Add metrics widget
    defaultWidgets.push({
      id: 'traffic-metrics',
      title: 'Network Traffic',
      type: 'metrics',
      width: isMobile ? 12 : isTablet ? 12 : 6,
      height: 400,
      data: {
        series: [
          {
            id: 'inbound',
            name: 'Inbound Traffic',
            color: theme.palette.primary.main,
            data: data.networkDashboard.trafficTrend.map((item: any) => ({
              date: new Date(item.timestamp),
              value: item.inbound
            }))
          },
          {
            id: 'outbound',
            name: 'Outbound Traffic',
            color: theme.palette.secondary.main,
            data: data.networkDashboard.trafficTrend.map((item: any) => ({
              date: new Date(item.timestamp),
              value: item.outbound
            }))
          }
        ]
      },
      config: {
        type: 'area',
        stacked: false,
        xAxisLabel: 'Time',
        yAxisLabel: 'Traffic (MB)'
      }
    });
    
    // Add entity list for non-mobile
    if (!isMobile) {
      defaultWidgets.push({
        id: 'entity-list',
        title: 'Active Entities',
        type: 'entityList',
        width: isTablet ? 12 : 6,
        height: 320,
        data: {
          entities: data.overview.entities.recent
        }
      });
    }
    
    // Add events widget
    defaultWidgets.push({
      id: 'recent-events',
      title: 'Security Events',
      type: 'events',
      width: isMobile ? 12 : isTablet ? 12 : 6,
      height: 320,
      data: {
        events: data.securityDashboard.recentEvents
      }
    });
    
    return defaultWidgets;
  };
  
  // Handle drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle widget click on mobile
  const handleWidgetClick = (widget: DashboardWidget) => {
    if (isMobile) {
      setMobileDetailView({
        open: true,
        title: widget.title,
        type: widget.type,
        data: widget
      });
    }
  };
  
  // Handle user menu
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Handle notifications menu
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
    
    // Refresh dashboard data every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Adjust drawer state based on screen size
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);
  
  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Security', icon: <Security />, path: '/security' },
    { text: 'Network', icon: <NetworkCheck />, path: '/network' },
    { text: 'Entities', icon: <Storage />, path: '/entities' },
    { text: 'Reports', icon: <Report />, path: '/reports' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];
  
  // Render tabs for mobile view
  const renderMobileTabs = () => {
    return (
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Overview" />
        <Tab label="Alerts" />
        <Tab label="Network" />
      </Tabs>
    );
  };
  
  // Render mobile detail view
  const renderMobileDetailView = () => {
    return (
      <MobileDetailView
        open={mobileDetailView.open}
        title={mobileDetailView.title}
        type={mobileDetailView.type}
        data={mobileDetailView.data}
        onClose={() => setMobileDetailView({ ...mobileDetailView, open: false })}
      />
    );
  };
  
  // Render main dashboard grid
  const renderDashboardGrid = () => {
    return (
      <Grid container spacing={2}>
        {widgets.map((widget) => (
          <Grid item xs={widget.width} key={widget.id}>
            <DashboardWidget
              widget={widget}
              onClick={() => handleWidgetClick(widget)}
              height={widget.height}
            />
          </Grid>
        ))}
      </Grid>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: '100%',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            NDR Korelasyon Motoru
          </Typography>
          
          <Box sx={{ display: 'flex' }}>
            <IconButton color="inherit" onClick={handleNotificationsOpen}>
              <Badge badgeContent={4} color="secondary">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          
          <Divider />
          
          <List>
            <ListItem button onClick={() => handleNavigation('/search')}>
              <ListItemIcon><Search /></ListItemIcon>
              <ListItemText primary="Search" />
            </ListItem>
            
            <ListItem button onClick={() => navigate('/settings')}>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          ml: { sm: drawerOpen ? `${drawerWidth}px` : 0 },
          mt: '64px',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h5" component="h1">
            Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Refresh />}
              onClick={loadDashboardData}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
            
            {!isMobile && (
              <Button
                startIcon={<Add />}
                variant="contained"
                size="small"
                color="primary"
              >
                Add Widget
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Mobile Tabs */}
        {isMobile && renderMobileTabs()}
        
        {/* Loading State */}
        {loading && !dashboardData && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 'calc(100vh - 200px)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {/* Error State */}
        {error && (
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              mt: 2,
            }}
          >
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={loadDashboardData}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Paper>
        )}
        
        {/* Dashboard Content */}
        {!loading && dashboardData && renderDashboardGrid()}
        
        {/* Mobile Detail View */}
        {isMobile && renderMobileDetailView()}
      </Box>
      
      {/* User Menu */}
      <Menu
        id="user-menu"
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/settings'); }}>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        id="notifications-menu"
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
      >
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="subtitle2" color="primary">
            Critical Alert
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="subtitle2">
            New security event detected
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="subtitle2">
            System update available
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleNotificationsClose(); navigate('/notifications'); }}>
          View All Notifications
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ResponsiveDashboard;
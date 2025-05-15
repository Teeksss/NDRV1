import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Button,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemIcon,
  FormGroup,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete,
  DeleteSweep,
  MoreVert,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Info,
  FilterList,
  Refresh,
  MarkEmailRead,
  Settings,
  ArrowBack,
  Schedule,
  Security
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { NotificationService } from '../services/NotificationService';

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  source: string;
  entityId?: string;
  alertId?: string;
  actionUrl?: string;
}

const NotificationsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // Load notifications
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Fetch notifications from service
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const notificationService = new NotificationService();
      const result = await notificationService.getNotifications();
      setNotifications(result);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setSelectedNotifications([]);
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      handleMarkAsRead([notification.id]);
    }
    
    // Navigate to related page if available
    if (notification.alertId) {
      navigate(`/alerts/${notification.alertId}`);
    } else if (notification.entityId) {
      navigate(`/entities/${notification.entityId}`);
    } else if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };
  
  // Handle notification selection
  const handleSelectNotification = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    event.stopPropagation();
    
    setSelectedNotifications(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const filtered = getFilteredNotifications();
      setSelectedNotifications(filtered.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = async (ids: string[] = selectedNotifications) => {
    if (ids.length === 0) return;
    
    try {
      const notificationService = new NotificationService();
      await notificationService.markAsRead(ids);
      
      // Update local state
      setNotifications(prev => prev.map(n => {
        if (ids.includes(n.id)) {
          return { ...n, read: true };
        }
        return n;
      }));
      
      setSnackbarMessage(`${ids.length} notification(s) marked as read`);
      setSnackbarOpen(true);
      setSelectedNotifications([]);
    } catch (err: any) {
      console.error('Failed to mark notifications as read:', err);
      setError('Failed to mark notifications as read. Please try again.');
    }
  };
  
  // Handle delete
  const handleDelete = async (ids: string[] = selectedNotifications) => {
    if (ids.length === 0) return;
    
    try {
      const notificationService = new NotificationService();
      await notificationService.deleteNotifications(ids);
      
      // Update local state
      setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
      
      setSnackbarMessage(`${ids.length} notification(s) deleted`);
      setSnackbarOpen(true);
      setSelectedNotifications([]);
    } catch (err: any) {
      console.error('Failed to delete notifications:', err);
      setError('Failed to delete notifications. Please try again.');
    }
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const notificationService = new NotificationService();
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      setSnackbarMessage('All notifications marked as read');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read. Please try again.');
    }
  };
  
  // Handle filter menu
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  // Handle type filter change
  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };
  
  // Get filtered notifications based on current tab and filters
  const getFilteredNotifications = () => {
    let filtered = [...notifications];
    
    // Filter by tab
    if (selectedTab === 1) {
      filtered = filtered.filter(n => !n.read);
    } else if (selectedTab === 2) {
      filtered = filtered.filter(n => n.read);
    }
    
    // Filter by type
    if (typeFilter.length > 0) {
      filtered = filtered.filter(n => typeFilter.includes(n.type));
    }
    
    return filtered;
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <ErrorIcon />;
      case 'success':
        return <CheckCircle />;
      default:
        return <Info />;
    }
  };
  
  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return theme.palette.info.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'success':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  // Format notification time
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
  };
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Filtered notifications
  const filteredNotifications = getFilteredNotifications();
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        <Box ml={2}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon fontSize="large" color="action" />
          </Badge>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="All" />
            <Tab 
              label={
                <Badge badgeContent={unreadCount} color="error">
                  Unread
                </Badge>
              }
            />
            <Tab label="Read" />
          </Tabs>
          
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchNotifications}>
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Filter">
              <IconButton onClick={handleFilterMenuOpen}>
                <FilterList />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notification Settings">
              <IconButton onClick={() => navigate('/settings')}>
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
      
      {/* Actions for selected notifications */}
      {selectedNotifications.length > 0 && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1">
              {selectedNotifications.length} notification(s) selected
            </Typography>
            
            <Box>
              <Button
                variant="outlined"
                startIcon={<MarkEmailRead />}
                onClick={() => handleMarkAsRead()}
                sx={{ mr: 1 }}
              >
                Mark as Read
              </Button>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleDelete()}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Notifications list */}
      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box textAlign="center" p={4}>
            <NotificationsIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Notifications
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {selectedTab === 1 
                ? "You don't have any unread notifications." 
                : selectedTab === 2 
                  ? "You don't have any read notifications."
                  : "You don't have any notifications yet."}
            </Typography>
          </Box>
        ) : (
          <>
            <Box p={2} display="flex" alignItems="center" bgcolor={theme.palette.background.default}>
              <Checkbox 
                onChange={handleSelectAll}
                checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < filteredNotifications.length}
              />
              
              <Box ml="auto">
                <Button
                  variant="text"
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={handleMarkAllAsRead}
                  disabled={!notifications.some(n => !n.read)}
                >
                  Mark All as Read
                </Button>
                
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  startIcon={<DeleteSweep />}
                  onClick={() => handleDelete(filteredNotifications.map(n => n.id))}
                  sx={{ ml: 1 }}
                >
                  Delete All
                </Button>
              </Box>
            </Box>
            
            <Divider />
            
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      py: 2,
                      bgcolor: notification.read ? 'inherit' : `${theme.palette.primary.main}10`,
                      '&:hover': {
                        bgcolor: theme.palette.action.hover
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedNotifications.includes(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleSelectNotification(e, notification.id)}
                      />
                    </ListItemIcon>
                    
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getNotificationColor(notification.type) }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant="subtitle1"
                            component="span"
                            sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                          >
                            {notification.title}
                          </Typography>
                          
                          <Typography variant="caption" color="textSecondary">
                            {formatNotificationTime(notification.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="textPrimary"
                            component="span"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          
                          <Box display="flex" gap={1}>
                            <Chip
                              label={notification.type}
                              size="small"
                              sx={{
                                bgcolor: getNotification
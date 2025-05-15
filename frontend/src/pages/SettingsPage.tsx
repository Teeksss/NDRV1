import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  RadioGroup,
  Radio,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Notifications,
  Security,
  Dashboard,
  DisplaySettings,
  Save,
  Delete,
  Refresh
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';
import { useSettings } from '../hooks/useSettings';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeContext();
  const { settings, updateSettings, resetSettings, loading: settingsLoading } = useSettings();
  
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [displaySettings, setDisplaySettings] = useState({
    refreshInterval: 60,
    language: 'en',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    chartAnimation: true,
    denseLayout: false
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    criticalAlerts: true,
    highAlerts: true,
    mediumAlerts: true,
    lowAlerts: false,
    systemUpdates: true,
    soundEnabled: false
  });
  const [dashboardSettings, setDashboardSettings] = useState({
    defaultPage: 'dashboard',
    widgetsPerRow: 3,
    autoRefresh: true,
    showHelp: true,
    compactView: false,
    favoriteWidgets: ['alerts', 'traffic', 'threats']
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    passwordExpiryDays: 90,
    mfaEnabled: false,
    apiTokensEnabled: true,
    auditLogging: true,
    userActivityTracking: true
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load settings when component mounts
  useEffect(() => {
    if (settings) {
      // Set initial values from global settings
      if (settings.display) {
        setDisplaySettings(prev => ({ ...prev, ...settings.display }));
      }
      if (settings.notifications) {
        setNotificationSettings(prev => ({ ...prev, ...settings.notifications }));
      }
      if (settings.dashboard) {
        setDashboardSettings(prev => ({ ...prev, ...settings.dashboard }));
      }
      if (settings.security) {
        setSecuritySettings(prev => ({ ...prev, ...settings.security }));
      }
    }
  }, [settings]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle display settings change
  const handleDisplayChange = (key: string, value: any) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle notification settings change
  const handleNotificationChange = (key: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle dashboard settings change
  const handleDashboardChange = (key: string, value: any) => {
    setDashboardSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle security settings change
  const handleSecurityChange = (key: string, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Combine all settings
      const combinedSettings = {
        display: displaySettings,
        notifications: notificationSettings,
        dashboard: dashboardSettings,
        security: securitySettings
      };
      
      // Update settings
      await updateSettings(combinedSettings);
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle reset settings
  const handleResetSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Reset settings
      await resetSettings();
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to reset settings. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Settings tabs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<DisplaySettings />} label="Display" />
              <Tab icon={<Notifications />} label="Notifications" />
              <Tab icon={<Dashboard />} label="Dashboard" />
              <Tab icon={<Security />} label="Security" />
            </Tabs>
          </Paper>
        </Grid>
        
        {/* Settings content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            {/* Display Settings */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Display Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mode === 'dark'}
                          onChange={toggleMode}
                          color="primary"
                        />
                      }
                      label="Dark Mode"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={displaySettings.language}
                        onChange={(e) => handleDisplayChange('language', e.target.value)}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="tr">Turkish</MenuItem>
                        <MenuItem value="de">German</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={displaySettings.dateFormat}
                        onChange={(e) => handleDisplayChange('dateFormat', e.target.value)}
                        label="Date Format"
                      >
                        <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                        <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                        <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Time Format</InputLabel>
                      <Select
                        value={displaySettings.timeFormat}
                        onChange={(e) => handleDisplayChange('timeFormat', e.target.value)}
                        label="Time Format"
                      >
                        <MenuItem value="12h">12 Hour (AM/PM)</MenuItem>
                        <MenuItem value="24h">24 Hour</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displaySettings.chartAnimation}
                          onChange={(e) => handleDisplayChange('chartAnimation', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Enable Chart Animations"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={displaySettings.denseLayout}
                          onChange={(e) => handleDisplayChange('denseLayout', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Use Dense Layout"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography gutterBottom>Data Refresh Interval (seconds)</Typography>
                    <Slider
                      value={displaySettings.refreshInterval}
                      onChange={(e, value) => handleDisplayChange('refreshInterval', value)}
                      min={10}
                      max={300}
                      step={10}
                      marks={[
                        { value: 10, label: '10s' },
                        { value: 60, label: '1m' },
                        { value: 180, label: '3m' },
                        { value: 300, label: '5m' }
                      ]}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Notification Settings */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Notification Channels
                        </Typography>
                        <List>
                          <ListItem disablePadding>
                            <ListItemText primary="Email Notifications" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.emailNotifications}
                                onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <ListItem disablePadding>
                            <ListItemText primary="In-App Notifications" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.inAppNotifications}
                                onChange={(e) => handleNotificationChange('inAppNotifications', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <ListItem disablePadding>
                            <ListItemText primary="Sound Notifications" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.soundEnabled}
                                onChange={(e) => handleNotificationChange('soundEnabled', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Alert Levels
                        </Typography>
                        <List>
                          <ListItem disablePadding>
                            <ListItemText primary="Critical Alerts" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.criticalAlerts}
                                onChange={(e) => handleNotificationChange('criticalAlerts', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <ListItem disablePadding>
                            <ListItemText primary="High Alerts" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.highAlerts}
                                onChange={(e) => handleNotificationChange('highAlerts', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <ListItem disablePadding>
                            <ListItemText primary="Medium Alerts" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.mediumAlerts}
                                onChange={(e) => handleNotificationChange('mediumAlerts', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          
                          <ListItem disablePadding>
                            <ListItemText primary="Low Alerts" />
                            <ListItemSecondaryAction>
                              <Switch
                                edge="end"
                                checked={notificationSettings.lowAlerts}
                                onChange={(e) => handleNotificationChange('lowAlerts', e.target.checked)}
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.systemUpdates}
                          onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                          color="primary"
                        />
                      }
                      label="System Updates and Announcements"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Dashboard Settings */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Dashboard Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Default Page</InputLabel>
                      <Select
                        value={dashboardSettings.defaultPage}
                        onChange={(e) => handleDashboardChange('defaultPage', e.target.value)}
                        label="Default Page"
                      >
                        <MenuItem value="dashboard">Dashboard</MenuItem>
                        <MenuItem value="security">Security</MenuItem>
                        <MenuItem value="network">Network</MenuItem>
                        <MenuItem value="alerts">Alerts</MenuItem
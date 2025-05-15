import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Warning,
  Security,
  Rule,
  SettingsApplications,
  Timeline,
  ViewList
} from '@mui/icons-material';
import { DashboardService } from '../services/DashboardService';
import { AlertService } from '../services/AlertService';
import { CorrelationService } from '../services/CorrelationService';
import { TimeSeriesChart } from '../components/visualization/TimeSeriesChart';
import { ThreatVisualization } from '../components/visualization/ThreatVisualization';
import { AlertList } from '../components/alerts/AlertList';
import { DataTable } from '../components/common/DataTable';
import { StatusCard } from '../components/dashboard/StatusCard';
import { useNavigate } from 'react-router-dom';

const SecurityPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [securityData, setSecurityData] = useState<any | null>(null);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [alertsTrend, setAlertsTrend] = useState<any[]>([]);
  const [correlationRules, setCorrelationRules] = useState<any[]>([]);

  // Load security dashboard data
  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  // Load security data
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardService = new DashboardService();
      const alertService = new AlertService();
      const correlationService = new CorrelationService();

      // Load security dashboard data
      const securityDashboardData = await dashboardService.getSecurityDashboard({ timeRange });
      setSecurityData(securityDashboardData);

      // Load alerts
      const alerts = await alertService.getAlerts({
        sort: 'timestamp',
        order: 'desc',
        limit: 10
      });
      setAlertsData(alerts);

      // Load alerts trend
      const trend = await alertService.getAlertTrend(
        securityDashboardData.startDate,
        securityDashboardData.endDate,
        'day'
      );
      setAlertsTrend(trend);

      // Load correlation rules
      const rules = await correlationService.getCorrelationRules({
        enabled: true,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setCorrelationRules(rules);

      setLoading(false);
    } catch (error) {
      console.error('Error loading security data:', error);
      setError('Failed to load security data. Please try again.');
      setLoading(false);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle alert click
  const handleAlertClick = (alert: any) => {
    navigate(`/alerts/${alert.id}`);
  };

  // Status card data
  const statusCardData = [
    {
      title: 'Critical Alerts',
      value: securityData?.alertsByLevel?.critical || 0,
      icon: <Warning />,
      color: 'error',
      change: securityData?.criticalAlertsChange
    },
    {
      title: 'High Alerts',
      value: securityData?.alertsByLevel?.high || 0,
      icon: <Warning />,
      color: 'warning',
      change: securityData?.highAlertsChange
    },
    {
      title: 'Active Rules',
      value: securityData?.activeRules || 0,
      icon: <Rule />,
      color: 'primary'
    },
    {
      title: 'Security Score',
      value: `${securityData?.securityScore || 0}%`,
      icon: <Security />,
      color: securityData?.securityScore >= 80 ? 'success' : 
             securityData?.securityScore >= 60 ? 'warning' : 'error'
    }
  ];

  // Correlation rule columns
  const ruleColumns = [
    { id: 'name', label: 'Rule Name', minWidth: 200 },
    { id: 'severity', label: 'Severity' },
    { id: 'description', label: 'Description', minWidth: 300 },
    { id: 'type', label: 'Type' },
    { 
      id: 'enabled', 
      label: 'Status',
      render: (row: any) => (
        <Chip 
          label={row.enabled ? 'Enabled' : 'Disabled'} 
          color={row.enabled ? 'success' : 'default'} 
          size="small" 
        />
      )
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Typography variant="h4" component="h1">
          Security Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={loadSecurityData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && !securityData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Refresh />}
            onClick={loadSecurityData}
          >
            Try Again
          </Button>
        </Paper>
      ) : (
        <>
          {/* Status cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {statusCardData.map((card, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <StatusCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  change={card.change}
                />
              </Grid>
            ))}
          </Grid>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<Timeline />} label="Overview" />
              <Tab icon={<Warning />} label="Alerts" />
              <Tab icon={<Rule />} label="Rules" />
              <Tab icon={<Security />} label="Threats" />
            </Tabs>
          </Paper>

          {/* Tab content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Alerts trend chart */}
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Alert Trends
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 400 }}>
                    <TimeSeriesChart
                      series={[
                        {
                          id: 'critical',
                          name: 'Critical',
                          data: alertsTrend.map(item => ({
                            date: new Date(item.date),
                            value: item.critical || 0
                          })),
                          color: theme.palette.error.main
                        },
                        {
                          id: 'high',
                          name: 'High',
                          data: alertsTrend.map(item => ({
                            date: new Date(item.date),
                            value: item.high || 0
                          })),
                          color: theme.palette.warning.main
                        },
                        {
                          id: 'medium',
                          name: 'Medium',
                          data: alertsTrend.map(item => ({
                            date: new Date(item.date),
                            value: item.medium || 0
                          })),
                          color: theme.palette.info.main
                        },
                        {
                          id: 'low',
                          name: 'Low',
                          data: alertsTrend.map(item => ({
                            date: new Date(item.date),
                            value: item.low || 0
                          })),
                          color: theme.palette.success.main
                        }
                      ]}
                      options={{
                        type: 'area',
                        stacked: false,
                        xAxisLabel: 'Date',
                        yAxisLabel: 'Count',
                        showLegend: true,
                        showGrid: true
                      }}
                      height={350}
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Security stats */}
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Security Statistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <Box position="relative" display="inline-flex">
                        <CircularProgress
                          variant="determinate"
                          value={securityData?.securityScore || 0}
                          size={120}
                          thickness={5}
                          sx={{
                            color: securityData?.securityScore >= 80 ? theme.palette.success.main : 
                                  securityData?.securityScore >= 60 ? theme.palette.warning.main : 
                                  theme.palette.error.main
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h5" component="div">
                            {`${securityData?.securityScore || 0}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box mt={4}>
                      <Typography variant="subtitle1" gutterBottom>
                        Security Recommendations
                      </Typography>
                      <List>
                        {securityData?.recommendations?.map((recommendation: string, index: number) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <SecurityRecommendation fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={recommendation} />
                          </ListItem>
                        )) || (
                          <ListItem>
                            <ListItemText primary="No recommendations at this time" />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Recent Alerts
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<ViewList />}
                  onClick={() => navigate('/alerts')}
                >
                  View All Alerts
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <AlertList
                alerts={alertsData}
                onMarkAsResolved={(id) => console.log('Mark as resolved:', id)}
                pagination
                clickable
              />
            </Paper>
          )}

          {activeTab === 2 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Correlation Rules
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<SettingsApplications />}
                  onClick={() => navigate('/settings/rules')}
                >
                  Manage Rules
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <DataTable
                columns={ruleColumns}
                data={correlationRules}
                pagination
                search
              />
            </Paper>
          )}

          {activeTab === 3 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Threat Activity Map
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 600 }}>
                <ThreatVisualization
                  height={550}
                  showWorldMap={true}
                  showTimeline={true}
                  showThreatTypes={true}
                />
              </Box>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default SecurityPage;
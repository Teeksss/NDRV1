import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Divider,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Avatar,
  useTheme,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Refresh,
  Computer,
  Storage,
  Router,
  Security,
  DeviceHub,
  Warning,
  Speed,
  NetworkCheck,
  Memory,
  History,
  Info,
  EventNote,
  Assessment
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { EntityService } from '../services/EntityService';
import { AlertService } from '../services/AlertService';
import { EventService } from '../services/EventService';
import { AlertList } from '../components/alerts/AlertList';
import { EventList } from '../components/events/EventList';
import { TimeSeriesChart } from '../components/visualization/TimeSeriesChart';
import { formatDate, formatRelativeTime, formatBytes } from '../utils/formatters';

const EntityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  // State
  const [entity, setEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [entityAlerts, setEntityAlerts] = useState<any[]>([]);
  const [entityEvents, setEntityEvents] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any | null>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load entity data
  useEffect(() => {
    if (!id) return;
    loadEntityData();
  }, [id]);

  // Load entity data
  const loadEntityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const entityService = new EntityService();
      const alertService = new AlertService();
      const eventService = new EventService();

      // Load entity details
      const entityData = await entityService.getEntityById(id!);
      setEntity(entityData);

      // Load entity alerts
      const alerts = await entityService.getEntityAlerts(id!, {
        limit: 10,
        sort: 'timestamp',
        order: 'desc'
      });
      setEntityAlerts(alerts);

      // Load entity events
      const events = await entityService.getEntityEvents(id!, {
        limit: 10,
        sort: 'timestamp',
        order: 'desc'
      });
      setEntityEvents(events);

      // Load entity traffic data
      const traffic = await entityService.getEntityTrafficData(id!, {
        interval: 'hour',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      setTrafficData(traffic);

      // Load entity relationships
      const relations = await entityService.getRelationships({ entityId: id });
      setRelationships(relations);

      setLoading(false);
    } catch (error) {
      console.error('Error loading entity data:', error);
      setError('Failed to load entity data. Please try again.');
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Delete entity
  const handleDeleteEntity = async () => {
    try {
      const entityService = new EntityService();
      await entityService.deleteEntity(id!);
      setDeleteDialogOpen(false);
      navigate('/entities');
    } catch (error) {
      console.error('Error deleting entity:', error);
      setError('Failed to delete entity. Please try again.');
      setDeleteDialogOpen(false);
    }
  };

  // Get entity icon
  const getEntityIcon = () => {
    switch (entity?.type?.toLowerCase()) {
      case 'server':
        return <Storage fontSize="large" />;
      case 'router':
        return <Router fontSize="large" />;
      case 'switch':
        return <DeviceHub fontSize="large" />;
      case 'firewall':
        return <Security fontSize="large" />;
      default:
        return <Computer fontSize="large" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'active':
        return theme.palette.success.main;
      case 'inactive':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'maintenance':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get related entity name
  const getRelatedEntityName = (relationshipType: string, isSource: boolean) => {
    return relationships
      .filter(rel => 
        isSource 
          ? rel.sourceEntityId === entity?.id && rel.type === relationshipType
          : rel.targetEntityId === entity?.id && rel.type === relationshipType
      )
      .map(rel => isSource ? rel.targetEntityName : rel.sourceEntityName);
  };

  // Render traffic chart
  const renderTrafficChart = () => {
    if (!trafficData || !trafficData.inbound || !trafficData.outbound) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography color="textSecondary">No traffic data available</Typography>
        </Box>
      );
    }

    return (
      <TimeSeriesChart
        series={[
          {
            id: 'inbound',
            name: 'Inbound Traffic',
            color: theme.palette.primary.main,
            data: trafficData.inbound.map((point: any) => ({
              date: new Date(point.timestamp),
              value: point.bytes / (1024 * 1024) // Convert to MB
            }))
          },
          {
            id: 'outbound',
            name: 'Outbound Traffic',
            color: theme.palette.secondary.main,
            data: trafficData.outbound.map((point: any) => ({
              date: new Date(point.timestamp),
              value: point.bytes / (1024 * 1024) // Convert to MB
            }))
          }
        ]}
        options={{
          title: 'Network Traffic',
          type: 'area',
          stacked: false,
          xAxisLabel: 'Time',
          yAxisLabel: 'Traffic (MB)',
          showGrid: true,
          showLegend: true,
          dateFormat: 'HH:mm'
        }}
        height={400}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          sx={{ mr: 2 }}
          onClick={() => navigate('/entities')}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Entity Details
        </Typography>
      </Box>

      {/* Loading or error state */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadEntityData}
          >
            Try Again
          </Button>
        </Paper>
      ) : (
        <>
          {/* Entity header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={9}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      width: 56,
                      height: 56
                    }}
                  >
                    {getEntityIcon()}
                  </Avatar>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      {entity?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip
                        label={entity?.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(entity?.status),
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={entity?.type}
                        size="small"
                        variant="outlined"
                      />
                      {entity?.ipAddress && (
                        <Chip
                          label={entity?.ipAddress}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {entity?.location && (
                        <Chip
                          label={entity?.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {entity?.tags?.map((tag: string, index: number) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Last seen {formatRelativeTime(entity?.lastSeen)} • {formatDate(entity?.lastSeen)}
                    </Typography>
                  </Box>
                </Box>
                {entity?.description && (
                  <Typography variant="body1" paragraph>
                    {entity?.description}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Edit />}
                    onClick={() => navigate(`/entities/edit/${entity?.id}`)}
                  >
                    Edit Entity
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Entity
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<Info />} label="Overview" />
              <Tab icon={<Warning />} label="Alerts" />
              <Tab icon={<EventNote />} label="Events" />
              <Tab icon={<Speed />} label="Performance" />
              <Tab icon={<NetworkCheck />} label="Connections" />
              <Tab icon={<History />} label="History" />
            </Tabs>
          </Paper>

          {/* Tab content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Entity details */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Info sx={{ mr: 1 }} /> Entity Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense disablePadding>
                      <ListItem>
                        <ListItemText 
                          primary="ID" 
                          secondary={entity?.id} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Name" 
                          secondary={entity?.name} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Type" 
                          secondary={entity?.type} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Status" 
                          secondary={entity?.status} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="IP Address" 
                          secondary={entity?.ipAddress || 'N/A'} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="MAC Address" 
                          secondary={entity?.macAddress || 'N/A'} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Location" 
                          secondary={entity?.location || 'N/A'} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Created Date" 
                          secondary={formatDate(entity?.createdAt)} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Last Updated" 
                          secondary={formatDate(entity?.updatedAt)} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Entity statistics */}
              <Grid item xs={12} md={6} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Assessment sx={{ mr: 1 }} /> Entity Statistics
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense disablePadding>
                      <ListItem>
                        <ListItemText 
                          primary="Active Alerts" 
                          secondary={
                            <Chip
                              label={entityAlerts.filter(a => a.status === 'open' || a.status === 'in_progress').length}
                              color="error"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          } 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Total Events (Last 24h)" 
                          secondary={entityEvents.length} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Connections" 
                          secondary={relationships.length} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      {entity?.metrics?.cpuUsage && (
                        <ListItem>
                          <ListItemText 
                            primary="CPU Usage" 
                            secondary={`${entity.metrics.cpuUsage}%`} 
                            primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                            secondaryTypographyProps={{ variant: 'body1' }}
                          />
                        </ListItem>
                      )}
                      {entity?.metrics?.memoryUsage && (
                        <ListItem>
                          <ListItemText 
                            primary="Memory Usage" 
                            secondary={`${entity.metrics.memoryUsage}%`} 
                            primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                            secondaryTypographyProps={{ variant: 'body1' }}
                          />
                        </ListItem>
                      )}
                      {entity?.metrics?.diskUsage && (
                        <ListItem>
                          <ListItemText 
                            primary="Disk Usage" 
                            secondary={`${entity.metrics.diskUsage}%`} 
                            primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                            secondaryTypographyProps={{ variant: 'body1' }}
                          />
                        </ListItem>
                      )}
                      {trafficData && (
                        <>
                          <ListItem>
                            <ListItemText 
                              primary="Total Inbound Traffic (24h)" 
                              secondary={formatBytes(trafficData.totalInbound || 0)} 
                              primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                              secondaryTypographyProps={{ variant: 'body1' }}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Total Outbound Traffic (24h)" 
                              secondary={formatBytes(trafficData.totalOutbound || 0)} 
                              primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                              secondaryTypographyProps={{ variant: 'body1' }}
                            />
                          </ListItem>
                        </>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent alerts */}
              <Grid item xs={12} lg={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Warning sx={{ mr: 1 }} /> Recent Alerts
                      </Box>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(1)}
                      >
                        View All
                      </Button>
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {entityAlerts.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                          No alerts for this entity
                        </Typography>
                      </Box>
                    ) : (
                      <AlertList
                        alerts={entityAlerts.slice(0, 5)}
                        compact
                        pagination={false}
                        clickable
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Traffic chart */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Network Traffic (Last 24 Hours)
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {renderTrafficChart()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Alerts tab */}
          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <AlertList
                  alerts={entityAlerts}
                  pagination
                  clickable
                />
              </CardContent>
            </Card>
          )}

          {/* Events tab */}
          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <EventList
                  events={entityEvents}
                  pagination
                  clickable
                />
              </CardContent>
            </Card>
          )}

          {/* Performance tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              {/* Traffic chart */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Network Traffic
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {renderTrafficChart()}
                  </CardContent>
                </Card>
              </Grid>

              {/* System metrics if available */}
              {entity?.metrics && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        System Metrics
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={3}>
                        {/* CPU Usage */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              CPU Usage
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={entity.metrics.cpuUsage || 0}
                                size={120}
                                thickness={5}
                                sx={{
                                  color: entity.metrics.cpuUsage > 80 ? theme.palette.error.main :
                                         entity.metrics.cpuUsage > 60 ? theme.palette.warning.main :
                                         theme.palette.success.main
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
                                  {`${entity.metrics.cpuUsage || 0}%`}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>

                        {/* Memory Usage */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Memory Usage
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={entity.metrics.memoryUsage || 0}
                                size={120}
                                thickness={5}
                                sx={{
                                  color: entity.metrics.memoryUsage > 80 ? theme.palette.error.main :
                                         entity.metrics.memoryUsage > 60 ? theme.palette.warning.main :
                                         theme.palette.success.main
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
                                  {`${entity.metrics.memoryUsage || 0}%`}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>

                        {/* Disk Usage */}
                        <Grid item xs={12} md={4}>
                          <Box sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Disk Usage
                            </Typography>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={entity.metrics.diskUsage || 0}
                                size={120}
                                thickness={5}
                                sx={{
                                  color: entity.metrics.diskUsage > 80 ? theme.palette.error.main :
                                         entity.metrics.diskUsage > 60 ? theme.palette.warning.main :
                                         theme.palette.success.main
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
                                  {`${entity.metrics.diskUsage || 0}%`}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Connections tab */}
          {activeTab === 4 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Network Connections
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {relationships.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="textSecondary">
                      No connections found for this entity
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Relationship Type</TableCell>
                          <TableCell>Direction</TableCell>
                          <TableCell>Connected Entity</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Last Seen</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relationships.map((rel) => (
                          <TableRow key={rel.id} hover onClick={() => {
                            // Navigate to the related entity
                            const relatedEntityId = rel.sourceEntityId === entity.id ? rel.targetEntityId : rel.sourceEntityId;
                            navigate(`/entities/${relatedEntityId}`);
                          }} sx={{ cursor: 'pointer' }}>
                            <TableCell>{rel.type}</TableCell>
                            <TableCell>
                              {rel.sourceEntityId === entity.id ? 'Outbound' : 'Inbound'}
                            </TableCell>
                            <TableCell>
                              {rel.sourceEntityId === entity.id ? rel.targetEntityName : rel.sourceEntityName}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={rel.status || 'Active'}
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(rel.status || 'active'),
                                  color: 'white'
                                }}
                              />
                            </TableCell>
                            <TableCell>{formatRelativeTime(rel.lastSeen)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}

          {/* History tab */}
          {activeTab === 5 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Entity History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {/* No history data available in this example */}
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    Entity history records are not available
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Delete confirmation dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Delete Entity</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete {entity?.name}? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteEntity} 
                color="error" 
                variant="contained"
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default EntityDetailPage;
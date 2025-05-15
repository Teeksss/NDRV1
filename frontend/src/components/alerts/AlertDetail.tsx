import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  TextField,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Link,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  CheckCircle as ResolveIcon,
  ErrorOutline as FalsePositiveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AlertService } from '../../services/AlertService';
import { EventService } from '../../services/EventService';
import { EntityService } from '../../services/EntityService';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import AlertSeverityBadge from './AlertSeverityBadge';
import AlertStatusBadge from './AlertStatusBadge';
import JsonViewer from '../common/JsonViewer';
import TimelineView from '../common/TimelineView';

interface AlertDetailProps {
  alertId: string;
  onStatusChange?: (status: string) => void;
  onDelete?: () => void;
}

const AlertDetail: React.FC<AlertDetailProps> = ({
  alertId,
  onStatusChange,
  onDelete
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Services
  const alertService = new AlertService();
  const eventService = new EventService();
  const entityService = new EntityService();
  
  // State
  const [alert, setAlert] = useState<any | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<any[]>([]);
  const [relatedAlerts, setRelatedAlerts] = useState<any[]>([]);
  const [entity, setEntity] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [commenting, setCommenting] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch alert data
  useEffect(() => {
    loadAlertData();
  }, [alertId]);
  
  // Load alert and related data
  const loadAlertData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get alert details
      const alertData = await alertService.getAlertById(alertId);
      setAlert(alertData);
      
      // Load related data in parallel
      const [eventsData, relatedAlertsData, entityData] = await Promise.all([
        // Get related events if available
        alertData.eventIds?.length > 0 
          ? eventService.getEventsByIds(alertData.eventIds)
          : [],
        
        // Get related alerts
        alertService.getRelatedAlerts(alertId),
        
        // Get entity details if available
        alertData.entityId
          ? entityService.getEntityById(alertData.entityId)
          : null
      ]);
      
      setRelatedEvents(eventsData);
      setRelatedAlerts(relatedAlertsData);
      setEntity(entityData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading alert data:', err);
      setError('Failed to load alert data. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle comment change
  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComment(event.target.value);
  };
  
  // Handle add comment
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setCommenting(true);
      
      await alertService.addComment(alertId, comment, user?.id);
      
      // Reload alert to get updated comments
      const updatedAlert = await alertService.getAlertById(alertId);
      setAlert(updatedAlert);
      
      // Clear comment field
      setComment('');
      setCommenting(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      setCommenting(false);
    }
  };
  
  // Handle more menu open
  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };
  
  // Handle more menu close
  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };
  
  // Handle status menu open
  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };
  
  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };
  
  // Handle status change
  const handleStatusChange = async (status: string) => {
    try {
      await alertService.updateAlertStatus(alertId, status);
      
      // Update local alert status
      setAlert(prev => ({ ...prev, status }));
      
      // Call callback if provided
      if (onStatusChange) {
        onStatusChange(status);
      }
      
      handleStatusMenuClose();
    } catch (err) {
      console.error('Error updating alert status:', err);
    }
  };
  
  // Handle delete alert
  const handleDeleteAlert = async () => {
    try {
      await alertService.deleteAlert(alertId);
      
      setDeleteDialogOpen(false);
      
      // Call callback if provided
      if (onDelete) {
        onDelete();
      } else {
        // Navigate back to alerts list
        navigate('/alerts');
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };
  
  // Handle navigate to event
  const handleNavigateToEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };
  
  // Handle navigate to entity
  const handleNavigateToEntity = (entityId: string) => {
    navigate(`/entities/${entityId}`);
  };
  
  // Render loading or error state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !alert) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" paragraph>
          {error || 'Alert not found'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/alerts')}
        >
          Back to Alerts
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Alert header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AlertSeverityBadge severity={alert.severity} size="large" />
            <Box sx={{ ml: 2 }}>
              <Typography variant="h5" component="h1" gutterBottom>
                {alert.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <AlertStatusBadge status={alert.status} />
                <Chip 
                  size="small" 
                  label={`ID: ${alert.id.substring(0, 8)}`} 
                  variant="outlined" 
                />
                <Typography variant="body2" color="textSecondary">
                  {formatRelativeTime(alert.timestamp)}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleStatusMenuOpen}
              sx={{ mr: 1 }}
            >
              Change Status
            </Button>
            
            <IconButton onClick={handleMoreMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1">
              {alert.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Source
                </Typography>
                <Typography variant="body2">
                  {alert.source}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body2">
                  {alert.type || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(alert.timestamp)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="textSecondary">
                  Category
                </Typography>
                <Typography variant="body2">
                  {alert.category || 'N/A'}
                </Typography>
              </Grid>
              
              {alert.tactic && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    MITRE ATT&CK
                  </Typography>
                  <Typography variant="body2">
                    {alert.tactic} {alert.technique ? `(${alert.technique})` : ''}
                    {alert.mitreAttackUrl && (
                      <Link href={alert.mitreAttackUrl} target="_blank" sx={{ ml: 1 }}>
                        View
                      </Link>
                    )}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
        
        {/* Tags */}
        {alert.tags && alert.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {alert.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 1, mt: 1 }}
              />
            ))}
          </Box>
        )}
      </Paper>
      
      {/* Tabs and content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="alert detail tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<EventIcon />} label="Events" />
          <Tab icon={<TimelineIcon />} label="Timeline" />
          <Tab icon={<CommentIcon />} label="Comments" />
          <Tab icon={<HistoryIcon />} label="History" />
          <Tab icon={<AssignmentIcon />} label="Details" />
        </Tabs>
        
        {/* Events Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {relatedEvents.length === 0 ? (
              <Typography align="center" sx={{ py: 3 }}>
                No related events found
              </Typography>
            ) : (
              <List>
                {relatedEvents.map((event, index) => (
                  <React.Fragment key={event.id}>
                    <ListItem 
                      button 
                      onClick={() => handleNavigateToEvent(event.id)}
                    >
                      <ListItemText
                        primary={event.type}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {formatDate(event.timestamp)}
                            </Typography>
                            {' — '}{event.description || 'No description'}
                          </>
                        }
                      />
                      <Chip 
                        size="small" 
                        label={event.source} 
                        variant="outlined" 
                      />
                    </ListItem>
                    {index < relatedEvents.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
        
        {/* Timeline Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <TimelineView 
              events={[
                {
                  id: alert.id,
                  title: 'Alert Created',
                  description: alert.title,
                  timestamp: alert.timestamp,
                  type: 'alert',
                  severity: alert.severity
                },
                ...relatedEvents.map(event => ({
                  id: event.id,
                  title: event.type,
                  description: event.description,
                  timestamp: event.timestamp,
                  type: 'event',
                  source: event.source
                })),
                ...(alert.statusHistory || []).map((history, index) => ({
                  id: `status-${index}`,
                  title: `Status Changed to ${history.status}`,
                  description: history.notes || 'Status updated',
                  timestamp: history.timestamp,
                  type: 'status',
                  user: history.user
                }))
              ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())}
            />
          </Box>
        )}
        
        {/* Comments Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Add a comment"
                multiline
                rows={3}
                value={comment}
                onChange={handleCommentChange}
                disabled={commenting}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleAddComment}
                  disabled={!comment.trim() || commenting}
                >
                  {commenting ? <CircularProgress size={24} /> : 'Add Comment'}
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {alert.comments && alert.comments.length > 0 ? (
              <List>
                {alert.comments.map((comment, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
                        {comment.user.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography
                            component="span"
                            variant="subtitle2"
                          >
                            {comment.user}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="textPrimary"
                            >
                              {comment.text}
                            </Typography>
                            <Typography
                              component="div"
                              variant="caption"
                              color="textSecondary"
                              sx={{ mt: 1 }}
                            >
                              {formatRelativeTime(comment.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < alert.comments.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography align="center" sx={{ py: 3 }}>
                No comments yet
              </Typography>
            )}
          </Box>
        )}
        
        {/* History Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            {alert.statusHistory && alert.statusHistory.length > 0 ? (
              <List>
                {alert.statusHistory.map((history, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={`Status changed to: ${history.status}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textSecondary">
                              {formatRelativeTime(history.timestamp)} by {history.user || 'System'}
                            </Typography>
                            {history.notes && (
                              <Typography component="div" variant="body2" sx={{ mt: 1 }}>
                                Notes: {history.notes}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < alert.statusHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography align="center" sx={{ py: 3 }}>
                No history available
              </Typography>
            )}
          </Box>
        )}
        
        {/* Details Tab */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Alert information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Alert Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          ID
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Status
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Created
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {formatDate(alert.createdAt || alert.timestamp)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Updated
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {formatDate(alert.updatedAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Created By
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.createdBy || 'System'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Updated By
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.updatedBy || 'System'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Priority
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.priority || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Assigned To
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {alert.assignedTo || 'Unassigned'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                
                {/* Entity information */}
                {entity && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Entity Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Name
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <Link 
                              component="button"
                              variant="body2"
                              onClick={() => handleNavigateToEntity(entity.id)}
                            >
                              {entity.name}
                            </Link>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Type
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            {entity.type}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            IP Address
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            {entity.ipAddress || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Status
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            {entity.status}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
                
                {/* Related alerts */}
                {relatedAlerts.length > 0 && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Related Alerts
                      </Typography>
                      <List dense>
                        {relatedAlerts.map(relatedAlert => (
                          <ListItem 
                            key={relatedAlert.id} 
                            button
                            onClick={() => navigate(`/alerts/${relatedAlert.id}`)}
                          >
                            <ListItemText
                              primary={relatedAlert.title}
                              secondary={formatDate(relatedAlert.timestamp)}
                            />
                            <AlertSeverityBadge severity={relatedAlert.severity} size="small" />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Grid>
              
              {/* Payload information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payload Data
                    </Typography>
                    {alert.payload ? (
                      <JsonViewer data={alert.payload} />
                    ) : (
                      <Typography align="center" sx={{ py: 3 }}>
                        No payload data available
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* Status menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem 
          onClick={() => handleStatusChange('open')}
          disabled={alert.status === 'open'}
        >
          <AlertStatusBadge status="open" />
          <Typography sx={{ ml: 1 }}>Open</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('in_progress')}
          disabled={alert.status === 'in_progress'}
        >
          <AlertStatusBadge status="in_progress" />
          <Typography sx={{ ml: 1 }}>In Progress</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('resolved')}
          disabled={alert.status === 'resolved'}
        >
          <AlertStatusBadge status="resolved" />
          <Typography sx={{ ml: 1 }}>Resolved</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('closed')}
          disabled={alert.status === 'closed'}
        >
          <AlertStatusBadge status="closed" />
          <Typography sx={{ ml: 1 }}>Closed</Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('false_positive')}
          disabled={alert.status === 'false_positive'}
        >
          <AlertStatusBadge status="false_positive" />
          <Typography sx={{ ml: 1 }}>False Positive</Typography>
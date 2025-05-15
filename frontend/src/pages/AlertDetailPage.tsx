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
  Menu,
  MenuItem,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  MoreVert,
  Security,
  Info,
  Computer,
  Event,
  Comment as CommentIcon,
  Send,
  Refresh,
  Link as LinkIcon,
  Share,
  DeleteOutline,
  NotificationsActive,
  Flag,
  Assignment
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertService } from '../services/AlertService';
import { EntityService } from '../services/EntityService';
import { EventService } from '../services/EventService';
import { AlertSeverityBadge } from '../components/alerts/AlertSeverityBadge';
import { TimelineEvent } from '../components/common/TimelineEvent';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatRelativeTime } from '../utils/formatters';

const AlertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [alert, setAlert] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedAlerts, setRelatedAlerts] = useState<any[]>([]);
  const [entity, setEntity] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [comment, setComment] = useState<string>('');

  // Load alert data
  useEffect(() => {
    if (!id) return;
    loadAlertData();
  }, [id]);

  // Load alert data
  const loadAlertData = async () => {
    try {
      setLoading(true);
      setError(null);

      const alertService = new AlertService();
      const entityService = new EntityService();
      const eventService = new EventService();

      // Load alert details
      const alertData = await alertService.getAlertById(id!);
      setAlert(alertData);

      // Load related alerts
      const relatedAlertsData = await alertService.getRelatedAlerts(id!);
      setRelatedAlerts(relatedAlertsData);

      // Load entity if available
      if (alertData.entityId) {
        const entityData = await entityService.getEntityById(alertData.entityId);
        setEntity(entityData);
      }

      // Load related events
      if (alertData.eventIds && alertData.eventIds.length > 0) {
        const eventsData = await eventService.getEventsByIds(alertData.eventIds);
        setEvents(eventsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading alert data:', error);
      setError('Failed to load alert data. Please try again.');
      setLoading(false);
    }
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Handle status dialog open
  const handleStatusDialogOpen = (status: string) => {
    setSelectedStatus(status);
    setStatusNotes('');
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  // Handle status change
  const handleStatusChange = async () => {
    try {
      const alertService = new AlertService();
      await alertService.updateAlertStatus(id!, selectedStatus, statusNotes);
      
      // Update alert in state
      setAlert(prev => ({
        ...prev,
        status: selectedStatus,
        statusHistory: [
          ...prev.statusHistory || [],
          {
            status: selectedStatus,
            notes: statusNotes,
            timestamp: new Date().toISOString(),
            user: user?.name
          }
        ]
      }));

      setStatusDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Alert status updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update alert status',
        severity: 'error'
      });
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) return;
    
    try {
      const alertService = new AlertService();
      await alertService.addComment(id!, comment, user?.name || 'Unknown');
      
      // Update alert in state
      setAlert(prev => ({
        ...prev,
        comments: [
          ...prev.comments || [],
          {
            text: comment,
            timestamp: new Date().toISOString(),
            user: user?.name
          }
        ]
      }));

      setComment('');
      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add comment',
        severity: 'error'
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'open':
        return theme.palette.error.main;
      case 'in_progress':
        return theme.palette.warning.main;
      case 'resolved':
        return theme.palette.success.main;
      case 'closed':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get alert status history
  const getStatusHistory = () => {
    if (!alert || !alert.statusHistory || alert.statusHistory.length === 0) {
      return [
        {
          status: alert?.status || 'open',
          timestamp: alert?.timestamp || new Date().toISOString(),
          user: alert?.createdBy || 'System'
        }
      ];
    }
    
    return [
      {
        status: 'open',
        timestamp: alert.timestamp,
        user: alert.createdBy || 'System'
      },
      ...alert.statusHistory
    ];
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          sx={{ mr: 2 }}
          onClick={() => navigate('/alerts')}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          Alert Details
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
            onClick={loadAlertData}
          >
            Try Again
          </Button>
        </Paper>
      ) : (
        <>
          {/* Alert header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={9}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <AlertSeverityBadge severity={alert?.severity} size="medium" />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h5" gutterBottom>
                      {alert?.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Chip
                        label={alert?.status?.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(alert?.status),
                          color: 'white'
                        }}
                      />
                      <Chip
                        label={alert?.source}
                        size="small"
                        variant="outlined"
                      />
                      {alert?.ipAddress && (
                        <Chip
                          label={alert?.ipAddress}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {alert?.tags?.map((tag: string, index: number) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Created {formatRelativeTime(alert?.timestamp)} • {formatDate(alert?.timestamp)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" paragraph>
                  {alert?.description}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleStatusDialogOpen('in_progress')}
                    disabled={alert?.status === 'in_progress'}
                  >
                    Investigate
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => handleStatusDialogOpen('resolved')}
                    disabled={alert?.status === 'resolved' || alert?.status === 'closed'}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    onClick={handleMenuOpen}
                    endIcon={<MoreVert />}
                  >
                    More Actions
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Alert details and context */}
          <Grid container spacing={3}>
            {/* Left side - Alert timeline and comments */}
            <Grid item xs={12} md={8}>
              {/* Alert timeline */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Alert Timeline
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ ml: 2 }}>
                  {getStatusHistory().map((statusChange, index) => (
                    <TimelineEvent
                      key={index}
                      time={statusChange.timestamp}
                      title={`Status changed to ${statusChange.status.replace('_', ' ')}`}
                      description={statusChange.notes}
                      user={statusChange.user}
                      iconColor={getStatusColor(statusChange.status)}
                      last={index === getStatusHistory().length - 1}
                    />
                  ))}
                  
                  {events.map((event, index) => (
                    <TimelineEvent
                      key={`event-${index}`}
                      time={event.timestamp}
                      title={`Event: ${event.type}`}
                      description={event.description}
                      icon={<Event />}
                      iconColor={theme.palette.info.main}
                      last={index === events.length - 1 && (!alert?.comments || alert.comments.length === 0)}
                    />
                  ))}
                  
                  {alert?.comments?.map((comment: any, index: number) => (
                    <TimelineEvent
                      key={`comment-${index}`}
                      time={comment.timestamp}
                      title="Comment added"
                      description={comment.text}
                      user={comment.user}
                      icon={<CommentIcon />}
                      iconColor={theme.palette.secondary.main}
                      last={index === alert.comments.length - 1}
                    />
                  ))}
                </Box>
              </Paper>

              {/* Add comment */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Add Comment
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box component="form" onSubmit={handleCommentSubmit}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Type your comment here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      endIcon={<Send />}
                      disabled={!comment.trim()}
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Right side - Alert context and related info */}
            <Grid item xs={12} md={4}>
              {/* Related entity */}
              {entity && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Computer sx={{ mr: 1 }} /> Related Entity
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense disablePadding>
                      <ListItem>
                        <ListItemText 
                          primary="Name" 
                          secondary={entity.name} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Type" 
                          secondary={entity.type} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="IP Address" 
                          secondary={entity.ipAddress} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Status" 
                          secondary={entity.status} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    </List>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={<LinkIcon />}
                        onClick={() => navigate(`/entities/${entity.id}`)}
                      >
                        View Entity Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Related alerts */}
              {relatedAlerts.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ mr: 1 }} /> Related Alerts
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <List dense disablePadding>
                      {relatedAlerts.map((relatedAlert) => (
                        <ListItem
                          key={relatedAlert.id}
                          button
                          onClick={() => navigate(`/alerts/${relatedAlert.id}`)}
                        >
                          <ListItemIcon>
                            <AlertSeverityBadge severity={relatedAlert.severity} iconOnly />
                          </ListItemIcon>
                          <ListItemText
                            primary={relatedAlert.title}
                            secondary={`${relatedAlert.status} • ${formatRelativeTime(relatedAlert.timestamp)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Alert details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1 }} /> Alert Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List dense disablePadding>
                    <ListItem>
                      <ListItemText 
                        primary="ID" 
                        secondary={alert?.id} 
                        primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Source" 
                        secondary={alert?.source} 
                        primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Severity" 
                        secondary={alert?.severity} 
                        primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Category" 
                        secondary={alert?.category || 'N/A'} 
                        primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        secondaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                    {alert?.tactic && (
                      <ListItem>
                        <ListItemText 
                          primary="MITRE ATT&CK Tactic" 
                          secondary={alert?.tactic} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    )}
                    {alert?.technique && (
                      <ListItem>
                        <ListItemText 
                          primary="MITRE ATT&CK Technique" 
                          secondary={alert?.technique} 
                          primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          secondaryTypographyProps={{ variant: 'body1' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Status change dialog */}
          <Dialog
            open={statusDialogOpen}
            onClose={() => setStatusDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Update Alert Status
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Change alert status to <strong>{selectedStatus.replace('_', ' ')}</strong>
              </DialogContentText>
              <TextField
                label="Notes (optional)"
                multiline
                rows={4}
                fullWidth
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusChange} variant="contained" color="primary">
                Update Status
              </Button>
            </DialogActions>
          </Dialog>

          {/* Action menu */}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleStatusDialogOpen('open')}>
              <ListItemIcon>
                <Flag sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              Mark as Open
            </MenuItem>
            <MenuItem onClick={() => handleStatusDialogOpen('in_progress')}>
              <ListItemIcon>
                <Assignment sx={{ color: theme.palette.warning.main }} />
              </ListItemIcon>
              Mark as In Progress
            </MenuItem>
            <MenuItem onClick={() => handleStatusDialogOpen('resolved')}>
              <ListItemIcon>
                <CheckCircle sx={{ color: theme.palette.success.main }} />
              </ListItemIcon>
              Mark as Resolved
            </MenuItem>
            <MenuItem onClick={() => handleStatusDialogOpen('closed')}>
              <ListItemIcon>
                <Archive sx={{ color: theme.palette.grey[500] }} />
              </ListItemIcon>
              Mark as Closed
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <NotificationsActive />
              </ListItemIcon>
              Create Notification
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <Share />
              </ListItemIcon>
              Share Alert
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose} sx={{ color: theme.palette.error.main }}>
              <ListItemIcon>
                <DeleteOutline sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              Delete Alert
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AlertDetailPage;
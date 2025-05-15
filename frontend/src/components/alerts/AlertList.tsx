import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Button,
  useTheme,
  Pagination
} from '@mui/material';
import {
  MoreVert,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  NavigateNext
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { AlertSeverityBadge } from './AlertSeverityBadge';

interface AlertListProps {
  alerts: any[];
  compact?: boolean;
  pagination?: boolean;
  clickable?: boolean;
  maxItems?: number;
  onMarkAsResolved?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  compact = false,
  pagination = true,
  clickable = true,
  maxItems,
  onMarkAsResolved,
  onDelete
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<{
    element: null | HTMLElement;
    id: string;
  }>({ element: null, id: '' });
  
  const itemsPerPage = compact ? 5 : 10;
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation();
    setMenuAnchor({ element: event.currentTarget, id });
  };
  
  // Handle menu close
  const handleMenuClose = (event?: React.MouseEvent<HTMLElement>) => {
    if (event) event.stopPropagation();
    setMenuAnchor({ element: null, id: '' });
  };
  
  // Handle mark as resolved
  const handleMarkAsResolved = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    if (onMarkAsResolved && menuAnchor.id) {
      onMarkAsResolved(menuAnchor.id);
    }
  };
  
  // Handle delete
  const handleDelete = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    if (onDelete && menuAnchor.id) {
      onDelete(menuAnchor.id);
    }
  };
  
  // Handle page change
  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle alert click
  const handleAlertClick = (alert: any) => {
    if (clickable) {
      navigate(`/alerts/${alert.id}`);
    }
  };
  
  // Get displayed alerts
  const getDisplayedAlerts = () => {
    if (maxItems) {
      return alerts.slice(0, maxItems);
    }
    
    if (pagination) {
      const start = (page - 1) * itemsPerPage;
      return alerts.slice(start, start + itemsPerPage);
    }
    
    return alerts;
  };
  
  // Get alert status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return theme.palette.warning.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'resolved':
        return theme.palette.success.main;
      case 'closed':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Get displayed alerts
  const displayedAlerts = getDisplayedAlerts();
  
  return (
    <Box>
      {alerts.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={4}
        >
          <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.light, mb: 2 }} />
          <Typography variant="h6" gutterBottom align="center">
            No Alerts
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            There are no alerts to display.
          </Typography>
        </Box>
      ) : (
        <>
          <List disablePadding>
            {displayedAlerts.map((alert, index) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  button={clickable}
                  onClick={() => handleAlertClick(alert)}
                  sx={{
                    py: compact ? 1 : 2,
                    px: compact ? 1 : 2,
                    '&:hover': clickable ? {
                      bgcolor: theme.palette.action.hover
                    } : {}
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      <AlertSeverityBadge severity={alert.severity} />
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant={compact ? 'subtitle2' : 'subtitle1'}
                            component="div"
                            noWrap
                            sx={{ maxWidth: compact ? '180px' : '300px' }}
                          >
                            {alert.title}
                          </Typography>
                          
                          {!compact && (
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={alert.status.replace('_', ' ')}
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(alert.status),
                                  color: 'white',
                                  mr: 1
                                }}
                              />
                              <Typography variant="caption" color="textSecondary">
                                {formatRelativeTime(alert.timestamp)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        compact ? (
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="textSecondary" noWrap>
                              {formatDate(alert.timestamp)}
                            </Typography>
                            <Chip
                              label={alert.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                bgcolor: getStatusColor(alert.status),
                                color: 'white'
                              }}
                            />
                          </Box>
                        ) : (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              noWrap
                              sx={{ maxWidth: '80%', mt: 0.5 }}
                            >
                              {alert.description}
                            </Typography>
                            <Box display="flex" mt={1} alignItems="center">
                              {alert.source && (
                                <Chip
                                  label={alert.source}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                              )}
                              {alert.ipAddress && (
                                <Chip
                                  label={alert.ipAddress}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </>
                        )
                      }
                    />
                    
                    {(onMarkAsResolved || onDelete) && (
                      <Box>
                        <IconButton
                          edge="end"
                          aria-label="actions"
                          onClick={(e) => handleMenuOpen(e, alert.id)}
                          size="small"
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    
                    {clickable && !compact && (
                      <Box ml={1} display="flex" alignItems="center">
                        <NavigateNext color="action" />
                      </Box>
                    )}
                  </Box>
                </ListItem>
                
                {index < displayedAlerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          {pagination && alerts.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Pagination
                count={Math.ceil(alerts.length / itemsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                size={compact ? 'small' : 'medium'}
              />
            </Box>
          )}
          
          {maxItems && alerts.length > maxItems && (
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => navigate('/alerts')}
              >
                View All ({alerts.length})
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor.element}
        open={Boolean(menuAnchor.element)}
        onClose={handleMenuClose}
      >
        {onMarkAsResolved && (
          <MenuItem onClick={handleMarkAsResolved}>
            <CheckCircle fontSize="small" sx={{ mr: 1 }} />
            Mark as Resolved
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
            <ErrorIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default AlertList;
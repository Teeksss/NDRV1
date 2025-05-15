import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Pagination,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  MoreVert,
  Visibility,
  Share,
  Delete,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface EventListProps {
  events: any[];
  onDelete?: (id: string) => void;
  pagination?: boolean;
  limit?: number;
  compact?: boolean;
  clickable?: boolean;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  onDelete,
  pagination = true,
  limit = 10,
  compact = false,
  clickable = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State
  const [page, setPage] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Total pages
  const totalPages = pagination ? Math.ceil(events.length / limit) : 1;
  
  // Current page events
  const currentEvents = pagination
    ? events.slice((page - 1) * limit, page * limit)
    : events;
  
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventItem: any) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedEvent(eventItem);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEvent(null);
  };
  
  // Handle delete
  const handleDelete = () => {
    if (selectedEvent && onDelete) {
      onDelete(selectedEvent.id);
    }
    handleMenuClose();
  };
  
  // Handle event click
  const handleEventClick = (event: any) => {
    if (clickable) {
      navigate(`/events/${event.id}`);
    }
  };
  
  // Get event icon based on type
  const getEventIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <CheckIcon color="success" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Get event type color
  const getEventTypeColor = (type: string): string => {
    switch (type?.toLowerCase()) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'success':
        return theme.palette.success.main;
      case 'info':
      default:
        return theme.palette.info.main;
    }
  };
  
  // Render compact view
  if (compact) {
    return (
      <List disablePadding>
        {currentEvents.map((event) => (
          <ListItem
            key={event.id}
            button={clickable}
            divider
            onClick={() => handleEventClick(event)}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: `${getEventTypeColor(event.type)}20`,
                  color: getEventTypeColor(event.type)
                }}
              >
                {getEventIcon(event.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={event.title || event.description}
              secondary={
                <React.Fragment>
                  {formatRelativeTime(event.timestamp)} • {event.sourceIp && `${event.sourceIp} • `}
                  {event.protocol && `${event.protocol} • `}
                  {event.source}
                </React.Fragment>
              }
            />
            {onDelete && (
              <IconButton
                edge="end"
                onClick={(e) => handleMenuOpen(e, event)}
              >
                <MoreVert />
              </IconButton>
            )}
          </ListItem>
        ))}
        
        {pagination && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
        
        {/* Event menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (selectedEvent) {
                navigate(`/events/${selectedEvent.id}`);
              }
            }}
          >
            <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Share fontSize="small" sx={{ mr: 1 }} /> Share
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
            <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </List>
    );
  }
  
  // Render standard view
  return (
    <Box>
      {currentEvents.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No events found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {currentEvents.map((event) => (
            <Grid item xs={12} key={event.id}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  cursor: clickable ? 'pointer' : 'default',
                  '&:hover': clickable ? {
                    bgcolor: theme.palette.action.hover
                  } : {}
                }}
                onClick={() => handleEventClick(event)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${getEventTypeColor(event.type)}20`,
                        color: getEventTypeColor(event.type),
                        mr: 1.5
                      }}
                    >
                      {getEventIcon(event.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" component="h3">
                        {event.title || 'Event'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatRelativeTime(event.timestamp)} • {formatDate(event.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={event.type || 'Info'}
                      size="small"
                      sx={{
                        bgcolor: getEventTypeColor(event.type),
                        color: 'white',
                        mr: 1
                      }}
                    />
                    
                    {onDelete && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, event)}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {event.description}
                </Typography>
                
                {(event.sourceIp || event.destinationIp || event.protocol) && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Grid container spacing={2}>
                      {event.sourceIp && (
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="textSecondary">
                            Source IP
                          </Typography>
                          <Typography variant="body2">
                            {event.sourceIp}
                          </Typography>
                        </Grid>
                      )}
                      {event.destinationIp && (
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="textSecondary">
                            Destination IP
                          </Typography>
                          <Typography variant="body2">
                            {event.destinationIp}
                          </Typography>
                        </Grid>
                      )}
                      {event.protocol && (
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="textSecondary">
                            Protocol
                          </Typography>
                          <Typography variant="body2">
                            {event.protocol}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
      
      {pagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
      
      {/* Event menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedEvent) {
              navigate(`/events/${selectedEvent.id}`);
            }
          }}
        >
          <Visibility fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Share fontSize="small" sx={{ mr: 1 }} /> Share
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EventList;
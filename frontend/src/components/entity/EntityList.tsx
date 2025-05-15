import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Button,
  useTheme,
  Pagination
} from '@mui/material';
import {
  MoreVert,
  NavigateNext,
  Computer,
  Storage,
  Router,
  Security,
  DeviceHub,
  Edit,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

interface EntityListProps {
  entities: any[];
  compact?: boolean;
  pagination?: boolean;
  clickable?: boolean;
  maxItems?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const EntityList: React.FC<EntityListProps> = ({
  entities,
  compact = false,
  pagination = true,
  clickable = true,
  maxItems,
  onEdit,
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
  
  // Handle edit
  const handleEdit = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleMenuClose();
    
    if (onEdit && menuAnchor.id) {
      onEdit(menuAnchor.id);
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
  
  // Handle entity click
  const handleEntityClick = (entity: any) => {
    if (clickable) {
      navigate(`/entities/${entity.id}`);
    }
  };
  
  // Get displayed entities
  const getDisplayedEntities = () => {
    if (maxItems) {
      return entities.slice(0, maxItems);
    }
    
    if (pagination) {
      const start = (page - 1) * itemsPerPage;
      return entities.slice(start, start + itemsPerPage);
    }
    
    return entities;
  };
  
  // Get entity icon based on type
  const getEntityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'server':
        return <Storage />;
      case 'router':
        return <Router />;
      case 'switch':
        return <DeviceHub />;
      case 'firewall':
        return <Security />;
      default:
        return <Computer />;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
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
  
  // Get displayed entities
  const displayedEntities = getDisplayedEntities();
  
  return (
    <Box>
      {entities.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={4}
        >
          <Computer sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 2 }} />
          <Typography variant="h6" gutterBottom align="center">
            No Entities
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            There are no entities to display.
          </Typography>
        </Box>
      ) : (
        <>
          <List disablePadding>
            {displayedEntities.map((entity, index) => (
              <React.Fragment key={entity.id}>
                <ListItem
                  button={clickable}
                  onClick={() => handleEntityClick(entity)}
                  sx={{
                    py: compact ? 1 : 2,
                    px: compact ? 1 : 2,
                    '&:hover': clickable ? {
                      bgcolor: theme.palette.action.hover
                    } : {}
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    {!compact && (
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.main
                          }}
                        >
                          {getEntityIcon(entity.type)}
                        </Avatar>
                      </ListItemAvatar>
                    )}
                    
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography
                            variant={compact ? 'subtitle2' : 'subtitle1'}
                            component="div"
                            noWrap
                            sx={{ maxWidth: compact ? '180px' : '300px' }}
                          >
                            {entity.name}
                          </Typography>
                          
                          {!compact && (
                            <Typography variant="caption" color="textSecondary">
                              {formatRelativeTime(entity.lastSeen)}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        compact ? (
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="textSecondary">
                              {entity.type} • {entity.ipAddress}
                            </Typography>
                            <Chip
                              label={entity.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.6rem',
                                bgcolor: getStatusColor(entity.status),
                                color: 'white'
                              }}
                            />
                          </Box>
                        ) : (
                          <>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ mb: 1 }}
                            >
                              {entity.ipAddress}
                              {entity.location && ` • ${entity.location}`}
                            </Typography>
                            
                            <Box display="flex" alignItems="center">
                              <Chip
                                label={entity.type}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              
                              <Chip
                                label={entity.status}
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(entity.status),
                                  color: 'white',
                                  mr: 1
                                }}
                              />
                              
                              {entity.tags?.map((tag: string, i: number) => (
                                <Chip
                                  key={i}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                              ))}
                            </Box>
                          </>
                        )
                      }
                    />
                    
                    {(onEdit || onDelete) && (
                      <Box>
                        <IconButton
                          edge="end"
                          aria-label="actions"
                          onClick={(e) => handleMenuOpen(e, entity.id)}
                          size="small"
                          sx={{ ml: 1 }}
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
                
                {index < displayedEntities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
          
          {pagination && entities.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Pagination
                count={Math.ceil(entities.length / itemsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                size={compact ? 'small' : 'medium'}
              />
            </Box>
          )}
          
          {maxItems && entities.length > maxItems && (
            <Box sx={{ textAlign: 'center', pt: 1 }}>
              <Button
                variant="text"
                color="primary"
                size="small"
                onClick={() => navigate('/entities')}
              >
                View All ({entities.length})
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
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default EntityList;
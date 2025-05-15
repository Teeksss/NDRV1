import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import {
  MoreVert,
  Refresh,
  Edit,
  Delete,
  Visibility,
  FullscreenExit,
  Fullscreen
} from '@mui/icons-material';
import { TimeSeriesChart } from '../visualization/TimeSeriesChart';
import { NetworkTopologyMap } from '../visualization/NetworkTopologyMap';
import { ThreatVisualization } from '../visualization/ThreatVisualization';
import { AlertList } from '../alerts/AlertList';
import { EventList } from '../events/EventList';

interface DashboardWidgetProps {
  widget: {
    id: string;
    title: string;
    type: string;
    data?: any;
    config?: any;
  };
  height?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
  onClick?: () => void;
  loading?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  height = 400,
  onEdit,
  onDelete,
  onRefresh,
  onClick,
  loading = false
}) => {
  const theme = useTheme();
  
  // State
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    handleMenuClose();
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    handleMenuClose();
  };
  
  // Render widget content based on type
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'metrics':
        return (
          <TimeSeriesChart
            series={widget.data?.series || []}
            options={widget.config}
            height={height - 60}
          />
        );
      case 'topology':
        return (
          <NetworkTopologyMap
            height={height - 60}
            refreshInterval={widget.config?.refreshInterval}
            initialFilters={widget.config?.filters}
          />
        );
      case 'threats':
        return (
          <ThreatVisualization
            height={height - 60}
            showWorldMap={widget.config?.showWorldMap}
            showTimeline={widget.config?.showTimeline}
            showThreatTypes={widget.config?.showThreatTypes}
          />
        );
      case 'alerts':
        return (
          <AlertList
            alerts={widget.data?.alerts || []}
            compact
            pagination={widget.data?.alerts?.length > 5}
            limit={5}
            clickable
          />
        );
      case 'events':
        return (
          <EventList
            events={widget.data?.events || []}
            compact
            pagination={widget.data?.events?.length > 5}
            limit={5}
            clickable
          />
        );
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Unknown widget type: {widget.type}
            </Typography>
          </Box>
        );
    }
  };
  
  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...(isFullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          height: '100vh',
          width: '100vw',
          borderRadius: 0
        }),
        ...(onClick && {
          cursor: 'pointer',
          '&:hover': {
            boxShadow: theme.shadows[4]
          }
        })
      }}
      onClick={onClick}
    >
      {/* Widget header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium">
          {widget.title}
        </Typography>
        
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e);
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Widget content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          renderWidgetContent()
        )}
      </Box>
      
      {/* Widget menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {onRefresh && (
          <MenuItem onClick={handleRefresh}>
            <ListItemIcon>
              <Refresh fontSize="small" />
            </ListItemIcon>
            <ListItemText>Refresh</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={toggleFullscreen}>
          <ListItemIcon>
            {isFullscreen ? (
              <FullscreenExit fontSize="small" />
            ) : (
              <Fullscreen fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</ListItemText>
        </MenuItem>
        
        {onClick && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onClick();
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
        )}
        
        {onEdit && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleMenuClose();
              onEdit();
            }}
          >
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Widget</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <>
            <Divider />
            <MenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClose();
                onDelete();
              }}
              sx={{ color: theme.palette.error.main }}
            >
              <ListItemIcon sx={{ color: theme.palette.error.main }}>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Remove Widget</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
    </Paper>
  );
};

export default DashboardWidget;
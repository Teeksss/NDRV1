import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  Person
} from '@mui/icons-material';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

interface TimelineEventProps {
  time: string | Date;
  title: string;
  description?: string;
  user?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  connectorColor?: string;
  last?: boolean;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({
  time,
  title,
  description,
  user,
  icon,
  iconColor,
  connectorColor,
  last = false
}) => {
  const theme = useTheme();
  
  // Default icon color to primary color
  const defaultIconColor = iconColor || theme.palette.primary.main;
  
  // Default connector color to divider color
  const defaultConnectorColor = connectorColor || theme.palette.divider;
  
  return (
    <Box display="flex" position="relative" mb={last ? 0 : 3}>
      {/* Timeline connector line */}
      {!last && (
        <Box
          position="absolute"
          left="20px"
          top="40px"
          bottom="-30px"
          width="2px"
          bgcolor={defaultConnectorColor}
          zIndex={1}
        />
      )}
      
      {/* Timeline icon/avatar */}
      <Avatar
        sx={{
          bgcolor: defaultIconColor,
          color: 'white',
          width: 40,
          height: 40,
          zIndex: 2
        }}
      >
        {icon || <EventIcon />}
      </Avatar>
      
      {/* Timeline content */}
      <Box ml={2} flexGrow={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="subtitle1" fontWeight="medium">
            {title}
          </Typography>
          
          <Typography variant="caption" color="textSecondary">
            {formatRelativeTime(time)}
          </Typography>
        </Box>
        
        {description && (
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: 1,
              mb: 1
            }}
          >
            <Typography variant="body2" color="textPrimary">
              {description}
            </Typography>
          </Paper>
        )}
        
        {user && (
          <Box display="flex" alignItems="center" mt={1}>
            <Person fontSize="small" color="action" sx={{ mr: 0.5 }} />
            <Typography variant="caption" color="textSecondary">
              {user}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mx: 0.5 }}>
              •
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDate(time)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TimelineEvent;
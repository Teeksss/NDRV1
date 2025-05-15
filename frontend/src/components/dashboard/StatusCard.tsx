import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  MoreVert,
  ArrowRight
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  change?: number;
  loading?: boolean;
  onClick?: () => void;
  detailsLink?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  change,
  loading = false,
  onClick,
  detailsLink
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Handle click event
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (detailsLink) {
      navigate(detailsLink);
    }
  };

  // Get color value based on theme
  const getColorValue = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      case 'success':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get change icon and color
  const renderChange = () => {
    if (change === undefined || change === null) return null;
    
    let changeIcon;
    let changeColor;
    
    if (change > 0) {
      changeIcon = <TrendingUp fontSize="small" />;
      changeColor = theme.palette.success.main;
    } else if (change < 0) {
      changeIcon = <TrendingDown fontSize="small" />;
      changeColor = theme.palette.error.main;
    } else {
      changeIcon = <TrendingFlat fontSize="small" />;
      changeColor = theme.palette.grey[500];
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: changeColor }}>
        {changeIcon}
        <Typography variant="caption" sx={{ ml: 0.5 }}>
          {change > 0 ? '+' : ''}{change}%
        </Typography>
      </Box>
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: (onClick || detailsLink) ? 'pointer' : 'default',
        '&:hover': (onClick || detailsLink) ? {
          transform: 'translateY(-4px)',
          boxShadow: 4
        } : {}
      }}
      onClick={handleClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" color="textSecondary">
          {title}
        </Typography>
        
        {detailsLink ? (
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(detailsLink);
              }}
            >
              <ArrowRight fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <IconButton size="small">
            <MoreVert fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${getColorValue()}20`,
              color: getColorValue(),
              borderRadius: '50%',
              p: 1,
              mr: 2
            }}
          >
            {icon}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <CircularProgress size={24} thickness={5} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: getColorValue()
              }}
            >
              {value}
            </Typography>
          )}
          
          {renderChange()}
        </Box>
      </Box>
    </Paper>
  );
};

export default StatusCard;
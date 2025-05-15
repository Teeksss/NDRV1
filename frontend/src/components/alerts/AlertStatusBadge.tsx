import React from 'react';
import { Chip, useTheme } from '@mui/material';
import {
  Check as ResolvedIcon,
  HourglassEmpty as OpenIcon,
  ErrorOutline as FalsePositiveIcon,
  Settings as InProgressIcon,
  Close as ClosedIcon
} from '@mui/icons-material';

interface AlertStatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const AlertStatusBadge: React.FC<AlertStatusBadgeProps> = ({
  status,
  size = 'small',
  variant = 'outlined'
}) => {
  const theme = useTheme();
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  
  // Get icon, color, and label based on status
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'open':
        return {
          icon: <OpenIcon fontSize="small" />,
          color: theme.palette.info.main,
          label: 'Open'
        };
      case 'in_progress':
        return {
          icon: <InProgressIcon fontSize="small" />,
          color: theme.palette.warning.main,
          label: 'In Progress'
        };
      case 'resolved':
        return {
          icon: <ResolvedIcon fontSize="small" />,
          color: theme.palette.success.main,
          label: 'Resolved'
        };
      case 'closed':
        return {
          icon: <ClosedIcon fontSize="small" />,
          color: theme.palette.grey[500],
          label: 'Closed'
        };
      case 'false_positive':
        return {
          icon: <FalsePositiveIcon fontSize="small" />,
          color: theme.palette.secondary.main,
          label: 'False Positive'
        };
      default:
        return {
          icon: <OpenIcon fontSize="small" />,
          color: theme.palette.grey[500],
          label: 'Unknown'
        };
    }
  };
  
  const { icon, color, label } = getStatusDetails(normalizedStatus);
  
  return (
    <Chip
      icon={icon}
      label={label}
      size={size}
      variant={variant}
      sx={{
        color: variant === 'outlined' ? color : undefined,
        backgroundColor: variant === 'filled' ? color : undefined,
        borderColor: color
      }}
    />
  );
};

export default AlertStatusBadge;
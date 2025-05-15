import React from 'react';
import { Chip, useTheme } from '@mui/material';
import {
  Warning as CriticalIcon,
  Report as HighIcon,
  ReportProblem as MediumIcon,
  Info as LowIcon,
  HelpOutline as InfoIcon
} from '@mui/icons-material';

interface AlertSeverityBadgeProps {
  severity: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'filled' | 'outlined';
}

const AlertSeverityBadge: React.FC<AlertSeverityBadgeProps> = ({
  severity,
  size = 'small',
  variant = 'filled'
}) => {
  const theme = useTheme();
  const normalizedSeverity = severity?.toLowerCase() || 'unknown';
  
  // Get icon, color, and label based on severity
  const getSeverityDetails = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <CriticalIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.error.dark,
          label: 'Kritik'
        };
      case 'high':
        return {
          icon: <HighIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.error.main,
          label: 'Yüksek'
        };
      case 'medium':
        return {
          icon: <MediumIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.warning.main,
          label: 'Orta'
        };
      case 'low':
        return {
          icon: <LowIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.info.main,
          label: 'Düşük'
        };
      case 'info':
        return {
          icon: <InfoIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.info.light,
          label: 'Bilgi'
        };
      default:
        return {
          icon: <InfoIcon fontSize={size === 'small' ? 'small' : 'medium'} />,
          color: theme.palette.grey[500],
          label: 'Bilinmiyor'
        };
    }
  };
  
  const { icon, color, label } = getSeverityDetails(normalizedSeverity);
  
  return (
    <Chip
      icon={icon}
      label={size === 'large' ? label : undefined}
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

export default AlertSeverityBadge;
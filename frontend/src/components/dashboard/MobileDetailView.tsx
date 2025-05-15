import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  useTheme,
  Paper
} from '@mui/material';
import { Close, Share, Download, Refresh } from '@mui/icons-material';
import { AlertList } from '../alerts/AlertList';
import { EventList } from '../events/EventList';
import { NetworkTopologyMap } from '../visualization/NetworkTopologyMap';
import { TimeSeriesChart } from '../visualization/TimeSeriesChart';
import { ThreatVisualization } from '../visualization/ThreatVisualization';
import { EntityList } from '../entity/EntityList';

interface MobileDetailViewProps {
  open: boolean;
  title: string;
  type: string;
  data: any;
  onClose: () => void;
}

export const MobileDetailView: React.FC<MobileDetailViewProps> = ({
  open,
  title,
  type,
  data,
  onClose
}) => {
  const theme = useTheme();
  
  // Render content based on type
  const renderContent = () => {
    if (!data) return null;
    
    switch (type) {
      case 'alerts':
        return (
          <AlertList
            alerts={data?.data?.alerts || []}
            compact={false}
            pagination={true}
            clickable={true}
          />
        );
      
      case 'events':
        return (
          <EventList
            events={data?.data?.events || []}
            compact={false}
            pagination={true}
            clickable={true}
          />
        );
      
      case 'metrics':
        return (
          <TimeSeriesChart
            series={data?.data?.series || []}
            options={data?.config || {}}
            height={500}
          />
        );
      
      case 'topology':
        return (
          <NetworkTopologyMap
            height={500}
            refreshInterval={data?.config?.refreshInterval}
          />
        );
      
      case 'threats':
        return (
          <ThreatVisualization
            height={500}
            showWorldMap={data?.config?.showWorldMap}
            showTimeline={data?.config?.showTimeline}
            showThreatTypes={data?.config?.showThreatTypes}
          />
        );
      
      case 'entityList':
        return (
          <EntityList
            entities={data?.data?.entities || []}
            compact={false}
            pagination={true}
            clickable={true}
          />
        );
      
      case 'status':
        return (
          <Box
            sx={{
              p: 3,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <Typography variant="h1" color={data?.data?.color || 'primary'}>
              {data?.data?.value}
            </Typography>
            
            <Typography color="textSecondary" variant="subtitle1">
              {data?.data?.change > 0 
                ? `↑ ${data?.data?.change}% increase`
                : data?.data?.change < 0
                  ? `↓ ${Math.abs(data?.data?.change)}% decrease`
                  : 'No change'}
              {' compared to previous period'}
            </Typography>
            
            <Paper elevation={2} sx={{ p: 2, width: '100%', mt: 2 }}>
              <Typography variant="h6" gutterBottom>Details</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Total:</Typography>
                <Typography variant="body2">{data?.data?.value}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Change:</Typography>
                <Typography variant="body2">{data?.data?.change}%</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Period:</Typography>
                <Typography variant="body2">Last 24 hours</Typography>
              </Box>
            </Paper>
          </Box>
        );
      
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>
              No detailed view available for this widget type.
            </Typography>
          </Box>
        );
    }
  };
  
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          height: '90vh',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="h6">{title}</Typography>
          
          <Box>
            <IconButton size="small" edge="end" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        
        {/* Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 0
          }}
        >
          {renderContent()}
        </Box>
        
        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Button
            startIcon={<Refresh />}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
          
          <Box>
            <IconButton size="small" sx={{ mr: 1 }}>
              <Share fontSize="small" />
            </IconButton>
            
            <IconButton size="small">
              <Download fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default MobileDetailView;
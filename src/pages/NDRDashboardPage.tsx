import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, PageHeader, Card, Spinner, Button, Alert, Tabs, Tab } from '@/components/ui';
import { 
  NDREventsWidget, 
  NetworkMapWidget, 
  TrafficAnalytics, 
  AlertsPanel,
  NDRServiceStatusWidget,
  ThreatIntelWidget,
  TopProtocolsChart,
  PacketCaptureWidget,
  SecurityScoreWidget,
  NDRMetricsWidget
} from '@/components/widgets';
import { TimeRangeSelector } from '@/components/common/TimeRangeSelector';
import { ndrActions } from '@/store/ndr/actions';
import { RootState } from '@/store/types';
import { usePageTitle } from '@/hooks/usePageTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { logger } from '@/utils/logger';
import './NDRDashboardPage.scss';

const NDRDashboardPage: React.FC = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  
  // Set page title
  usePageTitle('NDR Dashboard - NDRV1');
  
  // Redux state
  const {
    timeRange,
    serviceStatus,
    alerts,
    threatIntel
  } = useSelector((state: RootState) => state.ndr);
  
  // Load initial data
  useEffect(() => {
    // Check permissions
    if (!hasPermission('view:ndr_dashboard')) {
      logger.warn('User does not have permission to view NDR dashboard');
      return;
    }
    
    dispatch(ndrActions.fetchServiceStatus());
    dispatch(ndrActions.fetchAlerts({ timeRange }));
    dispatch(ndrActions.fetchThreatIntel());
  }, [dispatch, hasPermission, timeRange]);
  
  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    dispatch(ndrActions.setTimeRange(newTimeRange));
  };
  
  // Handle event click
  const handleEventClick = (event: any) => {
    //
import React, { useEffect, useState } from 'react';
import { Card, Spinner, Badge, Button } from '@/components/ui';
import { DashboardIcon, RefreshIcon, AlertIcon, ShieldIcon, TimeIcon } from '@/components/icons';
import { CircularProgressChart, LineChart } from '@/components/charts';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { AlertService } from '@/services/AlertService';
import { formatNumber, formatDate } from '@/utils/formatters';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';
import './NDRDashboardSummary.scss';

interface NDRDashboardSummaryProps {
  timeRange: TimeRange;
  onRefresh?: () => void;
  className?: string;
}

const NDRDashboardSummary: React.FC<NDRDashboardSummaryProps> = ({
  timeRange,
  onRefresh,
  className = ''
}) => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [detectionMetrics, setDetectionMetrics] = useState<any | null>(null);
  const [alertsTimeline, setAlertsTimeline] = useState<any | null>(null);
  const [securityScore, setSecurityScore] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchData();
  }, [timeRange]);
  
  // Fetch all required data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch system summary
      const summaryData = await NDRIntegrationService.getSystemSummary(timeRange);
      setSummary(summaryData);
      
      // Fetch detection metrics
      const metricsData = await NDRIntegrationService.getDetectionMetrics(timeRange);
      setDetectionMetrics(metricsData);
      
      // Fetch alerts timeline
      const alerts = await AlertService.getAlertsTimeline(timeRange);
      setAlertsTimeline(alerts);
      
      // Calculate security score
      setSecurityScore(calculateSecurityScore(summaryData, metricsData));
      
      // Update timestamp
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (error) {
      logger.error('Error fetching dashboard summary data:', error);
      setError('Özet verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate security score based on metrics
  const calculateSecurityScore = (summaryData: any, metricsData: any): number => {
    if (!summaryData || !metricsData) return 0;
    
    // This is a simplified scoring algorithm
    // A real implementation would use more sophisticated weighting and factors
    
    let score = 100;
    
    // Reduce score based on active critical

import React, { useState, useEffect } from 'react';
import { AlertService } from '@/services/AlertService';
import { Alert } from '@/models/Alert';
import { Severity } from '@/types/severity';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button, Spinner, Select, DatePicker } from '@/components/ui';
import { AlertIcon, FilterIcon, RefreshIcon } from '@/components/icons';
import './AlertsPanel.scss';

interface AlertsPanelProps {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onAlertClick?: (alert: Alert) => void;
  className?: string;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  limit = 5, 
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute default
  onAlertClick,
  className = ''
}) => {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | 'all'>('all');
  const [status, setStatus] = useState<'open' | 'closed' | 'all'>('open');
  
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit };
      
      if (severity !== 'all') {
        params.severity = severity;
      }
      
      if (status !== 'all') {
        params.status = status;
      }
      
      const response = await AlertService.getAlerts(params);
      setAlerts(response.alerts);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [severity, status, limit]);
  
  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, severity, status]);
  
  const handleRefresh = () => {
    fetchAlerts();
  };
  
  const handleSeverityChange = (value: string) => {
    setSeverity(value as Severity | 'all');
  };
  
  const handleStatusChange = (value: string) => {
    setStatus(value as 'open' | 'closed' | 'all');
  };
  
  const getSeverityColor = (severity: Severity): string => {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'caution';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card 
      className={`alerts-panel ${theme} ${className}`}
      title="Security Alerts"
      titleIcon={<AlertIcon />}
      actions={
        <>
          <Select 
            value={severity}
            onChange={handleSeverityChange}
            label="Severity"
            options={[
              { value: 'all', label: 'All Severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
            icon={<FilterIcon />}
          />
          
          <Select 
            value={status}
            onChange={handleStatusChange}
            label="Status"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
              { value: 'all', label: 'All Statuses' }
            ]}
            icon={<FilterIcon />}
          />
          
          <Button 
            icon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="icon"
            aria-label="Refresh alerts"
            title="Refresh"
          />
        </>
      }
    >
      {loading && alerts.length === 0 ? (
        <div className="alerts-panel__loading">
          <Spinner size="medium" />
          <p>Loading alerts...</p>
        </div>
      ) : error ? (
        <div className="alerts-panel__error">
          <p>{error}</p>
          <Button onClick={handleRefresh} variant="primary">
            Retry
          </Button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="alerts-panel__empty">
          <p>No alerts found matching your criteria.</p>
        </div>
      ) : (
        <div className="alerts-panel__list">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="alerts-panel__item"
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              <div className="alerts-panel__item-header">
                <h4 className="alerts-panel__item-title">{alert.title}</h4>
                <Badge color={getSeverityColor(alert.severity)}>
                  {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                </Badge>
              </div>
              
              <p className="alerts-panel__item-description">{alert.description}</p>
              
              <div className="alerts-panel__item-details">
                <span className="alerts-panel__item-source">
                  Source: {alert.sourceIp}
                </span>
                <span className="alerts-panel__item-target">
                  Target: {alert.targetIp}
                </span>
                <span className="alerts-panel__item-time">
                  {formatTimestamp(alert.timestamp)}
                </span>
              </div>
            </div>
          ))}
          
          {alerts.length >= limit && (
            <div className="alerts-panel__view-all">
              <Button variant="link">
                View All Alerts
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AlertsPanel;
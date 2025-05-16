import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AlertsList from '../AlertsList';
import { AlertService } from '@/services/AlertService';

// Mock the alert service
jest.mock('@/services/AlertService');

const mockAlerts = [
  {
    id: 'alert_1',
    title: 'Suspicious Port Scan',
    description: 'Multiple connection attempts detected',
    sourceIp: '203.0.113.45',
    targetIp: '192.168.1.10',
    severity: 'high',
    status: 'open',
    timestamp: '2025-05-16T06:12:33Z',
    category: 'reconnaissance'
  },
  {
    id: 'alert_2',
    title: 'Unusual Data Transfer',
    description: 'Large data transfer to external IP',
    sourceIp: '192.168.1.34',
    targetIp: '198.51.100.67',
    severity: 'medium',
    status: 'open',
    timestamp: '2025-05-16T05:45:21Z',
    category: 'data-exfiltration'
  }
];

describe('AlertsList Component', () => {
  beforeEach(() => {
    (AlertService.getAlerts as jest.Mock).mockResolvedValue({
      total: mockAlerts.length,
      alerts: mockAlerts
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the alerts list', async () => {
    render(<AlertsList />);
    
    // Check if loading state is shown
    expect(screen.getByText(/Loading alerts/i)).toBeInTheDocument();
    
    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Suspicious Port Scan')).toBeInTheDocument();
    });
    
    // Check if both alerts are rendered
    expect(screen.getByText('Suspicious Port Scan')).toBeInTheDocument();
    expect(screen.getByText('Unusual Data Transfer')).toBeInTheDocument();
    
    // Check if severity badges are rendered correctly
    const highSeverityBadges = screen.getAllByText('High');
    const mediumSeverityBadges = screen.getAllByText('Medium');
    expect(highSeverityBadges.length).toBe(1);
    expect(mediumSeverityBadges.length).toBe(1);
  });

  test('filters alerts by severity', async () => {
    (AlertService.getAlerts as jest.Mock).mockImplementation((params) => {
      if (params.severity === 'high') {
        return Promise.resolve({
          total: 1,
          alerts: [mockAlerts[0]]
        });
      }
      return Promise.resolve({
        total: mockAlerts.length,
        alerts: mockAlerts
      });
    });

    render(<AlertsList />);
    
    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.getByText('Suspicious Port Scan')).toBeInTheDocument();
    });
    
    // Filter by high severity
    fireEvent.click(screen.getByLabelText('Filter by severity'));
    fireEvent.click(screen.getByText('High'));
    
    // Check if API was called with correct parameters
    expect(AlertService.getAlerts).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'high'
    }));
    
    // Check if only high severity alert is shown
    await waitFor(() => {
      expect(screen.getByText('Suspicious Port Scan')).toBeInTheDocument();
      expect(screen.queryByText('Unusual Data Transfer')).not.toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    // Mock API error
    (AlertService.getAlerts as jest.Mock).mockRejectedValue(new Error('Failed to fetch alerts'));
    
    render(<AlertsList />);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Error loading alerts/i)).toBeInTheDocument();
    });
    
    // Check if retry button is available
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    // Mock successful retry
    (AlertService.getAlerts as jest.Mock).mockResolvedValue({
      total: mockAlerts.length,
      alerts: mockAlerts
    });
    
    // Click retry
    fireEvent.click(retryButton);
    
    // Check if alerts load after retry
    await waitFor(() => {
      expect(screen.getByText('Suspicious Port Scan')).toBeInTheDocument();
    });
  });
});
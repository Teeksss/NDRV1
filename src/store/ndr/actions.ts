import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { NDRIntegrationService } from '@/services/NDRIntegrationService';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

// Action Types
export const NDR_FETCH_SERVICE_STATUS = 'ndr/fetchServiceStatus';
export const NDR_FETCH_ALERTS = 'ndr/fetchAlerts';
export const NDR_FETCH_ZEEK_EVENTS = 'ndr/fetchZeekEvents';
export const NDR_FETCH_SESSIONS = 'ndr/fetchSessions';
export const NDR_FETCH_THREAT_INTEL = 'ndr/fetchThreatIntel';
export const NDR_FETCH_METRICS = 'ndr/fetchMetrics';
export const NDR_SET_TIME_RANGE = 'ndr/setTimeRange';

// Sync Actions
export const setTimeRange = createAction<TimeRange>(NDR_SET_TIME_RANGE);

// Async Actions
export const fetchServiceStatus = createAsyncThunk(
  NDR_FETCH_SERVICE_STATUS,
  async (_, { rejectWithValue }) => {
    try {
      const result = await NDRIntegrationService.getServiceStatus();
      return result;
    } catch (error) {
      logger.error('Error fetching NDR service status:', error);
      return rejectWithValue('NDR servis durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

export const fetchAlerts = createAsyncThunk(
  NDR_FETCH_ALERTS,
  async ({ 
    timeRange, 
    severity,
    limit = 100 
  }: { 
    timeRange: TimeRange; 
    severity?: number;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const alerts = await NDRIntegrationService.getSuricataAlerts(timeRange, severity, limit);
      return alerts;
    } catch (error) {
      logger.error('Error fetching NDR alerts:', error);
      return rejectWithValue('Uyarılar alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

export const fetchZeekEvents = createAsyncThunk(
  NDR_FETCH_ZEEK_EVENTS,
  async ({ 
    timeRange, 
    limit = 100 
  }: { 
    timeRange: TimeRange; 
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const events = await NDRIntegrationService.getZeekEvents(timeRange, limit);
      return events;
    } catch (error) {
      logger.error('Error fetching Zeek events:', error);
      return rejectWithValue('Zeek olayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

export const fetchSessions = createAsyncThunk(
  NDR_FETCH_SESSIONS,
  async ({ 
    timeRange, 
    query,
    limit = 100 
  }: { 
    timeRange: TimeRange; 
    query?: string;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const sessions = await NDRIntegrationService.getArkimeSessions(timeRange, query, limit);
      return sessions;
    } catch (error) {
      logger.error('Error fetching Arkime sessions:', error);
      return rejectWithValue('Oturumlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

export const fetchThreatIntel = createAsyncThunk(
  NDR_FETCH_THREAT_INTEL,
  async (_, { rejectWithValue }) => {
    try {
      const threatIntel = await NDRIntegrationService.getThreatIntelStats();
      return threatIntel;
    } catch (error) {
      logger.error('Error fetching threat intelligence stats:', error);
      return rejectWithValue('Tehdit istihbaratı istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

export const fetchMetrics = createAsyncThunk(
  NDR_FETCH_METRICS,
  async ({ 
    query, 
    timeRange 
  }: { 
    query: string; 
    timeRange: TimeRange;
  }, { rejectWithValue }) => {
    try {
      const metrics = await NDRIntegrationService.getPrometheusMetrics(query, timeRange);
      return metrics;
    } catch (error) {
      logger.error('Error fetching Prometheus metrics:', error);
      return rejectWithValue('Metrikler alınamadı. Lütfen tekrar deneyin.');
    }
  }
);

// Export all actions
export const ndrActions = {
  setTimeRange,
  fetchServiceStatus,
  fetchAlerts,
  fetchZeekEvents,
  fetchSessions,
  fetchThreatIntel,
  fetchMetrics
};
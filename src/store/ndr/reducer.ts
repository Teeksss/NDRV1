import { createReducer } from '@reduxjs/toolkit';
import { 
  setTimeRange,
  fetchServiceStatus,
  fetchAlerts, 
  fetchZeekEvents,
  fetchSessions,
  fetchThreatIntel,
  fetchMetrics
} from './actions';
import { TimeRange } from '@/types/analytics';

// State interface
export interface NDRState {
  timeRange: TimeRange;
  serviceStatus: {
    data: any;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  alerts: {
    data: any[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  zeekEvents: {
    data: any[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  sessions: {
    data: any[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  threatIntel: {
    data: any;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  metrics: {
    data: any;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
}

// Initial state
const initialState: NDRState = {
  timeRange: '24h',
  serviceStatus: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  alerts: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  zeekEvents: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  sessions: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null
  },
  threatIntel: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  },
  metrics: {
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  }
};

// Reducer
export const ndrReducer = createReducer(initialState, (builder) => {
  builder
    // Time Range
    .addCase(setTimeRange, (state, action) => {
      state.timeRange = action.payload;
    })
    
    // Service Status
    .addCase(fetchServiceStatus.pending, (state) => {
      state.serviceStatus.loading = true;
      state.serviceStatus.error = null;
    })
    .addCase(fetchServiceStatus.fulfilled, (state, action) => {
      state.serviceStatus.loading = false;
      state.serviceStatus.data = action.payload;
      state.serviceStatus.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchServiceStatus.rejected, (state, action) => {
      state.serviceStatus.loading = false;
      state.serviceStatus.error = action.payload as string;
    })
    
    // Alerts
    .addCase(fetchAlerts.pending, (state) => {
      state.alerts.loading = true;
      state.alerts.error = null;
    })
    .addCase(fetchAlerts.fulfilled, (state, action) => {
      state.alerts.loading = false;
      state.alerts.data = action.payload;
      state.alerts.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchAlerts.rejected, (state, action) => {
      state.alerts.loading = false;
      state.alerts.error = action.payload as string;
    })
    
    // Zeek Events
    .addCase(fetchZeekEvents.pending, (state) => {
      state.zeekEvents.loading = true;
      state.zeekEvents.error = null;
    })
    .addCase(fetchZeekEvents.fulfilled, (state, action) => {
      state.zeekEvents.loading = false;
      state.zeekEvents.data = action.payload;
      state.zeekEvents.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchZeekEvents.rejected, (state, action) => {
      state.zeekEvents.loading = false;
      state.zeekEvents.error = action.payload as string;
    })
    
    // Sessions
    .addCase(fetchSessions.pending, (state) => {
      state.sessions.loading = true;
      state.sessions.error = null;
    })
    .addCase(fetchSessions.fulfilled, (state, action) => {
      state.sessions.loading = false;
      state.sessions.data = action.payload;
      state.sessions.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchSessions.rejected, (state, action) => {
      state.sessions.loading = false;
      state.sessions.error = action.payload as string;
    })
    
    // Threat Intel
    .addCase(fetchThreatIntel.pending, (state) => {
      state.threatIntel.loading = true;
      state.threatIntel.error = null;
    })
    .addCase(fetchThreatIntel.fulfilled, (state, action) => {
      state.threatIntel.loading = false;
      state.threatIntel.data = action.payload;
      state.threatIntel.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchThreatIntel.rejected, (state, action) => {
      state.threatIntel.loading = false;
      state.threatIntel.error = action.payload as string;
    })
    
    // Metrics
    .addCase(fetchMetrics.pending, (state) => {
      state.metrics.loading = true;
      state.metrics.error = null;
    })
    .addCase(fetchMetrics.fulfilled, (state, action) => {
      state.metrics.loading = false;
      state.metrics.data = action.payload;
      state.metrics.lastUpdated = new Date().toISOString();
    })
    .addCase(fetchMetrics.rejected, (state, action) => {
      state.metrics.loading = false;
      state.metrics.error = action.payload as string;
    });
});
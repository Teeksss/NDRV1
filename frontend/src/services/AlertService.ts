import ApiService from './ApiService';
import { format } from 'date-fns';

export class AlertService {
  private apiService: ApiService;
  
  constructor() {
    this.apiService = ApiService.getInstance();
  }
  
  // Get all alerts with optional filtering
  async getAlerts(filters?: {
    severity?: string | string[];
    status?: string | string[];
    search?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    entityId?: string;
    type?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }) {
    try {
      // Format dates if provided
      let formattedFilters = { ...filters };
      
      if (filters?.startDate) {
        formattedFilters.startDate = typeof filters.startDate === 'string' 
          ? filters.startDate 
          : format(filters.startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (filters?.endDate) {
        formattedFilters.endDate = typeof filters.endDate === 'string' 
          ? filters.endDate 
          : format(filters.endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/alerts', formattedFilters);
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }
  
  // Get a single alert by ID
  async getAlertById(id: string) {
    try {
      return this.apiService.get(`/alerts/${id}`);
    } catch (error) {
      console.error(`Error getting alert ${id}:`, error);
      throw error;
    }
  }
  
  // Create a new alert
  async createAlert(alertData: any) {
    try {
      return this.apiService.post('/alerts', alertData);
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }
  
  // Update an alert
  async updateAlert(id: string, updateData: any) {
    try {
      return this.apiService.patch(`/alerts/${id}`, updateData);
    } catch (error) {
      console.error(`Error updating alert ${id}:`, error);
      throw error;
    }
  }
  
  // Update alert status
  async updateAlertStatus(id: string, status: string, notes?: string) {
    try {
      return this.apiService.patch(`/alerts/${id}/status`, { status, notes });
    } catch (error) {
      console.error(`Error updating alert ${id} status:`, error);
      throw error;
    }
  }
  
  // Bulk update alert status
  async bulkUpdateStatus(ids: string[], status: string, notes?: string) {
    try {
      return this.apiService.patch('/alerts/bulk-status', { ids, status, notes });
    } catch (error) {
      console.error('Error bulk updating alert status:', error);
      throw error;
    }
  }
  
  // Add a comment to an alert
  async addComment(id: string, text: string, userId?: string) {
    try {
      return this.apiService.post(`/alerts/${id}/comments`, { text, userId });
    } catch (error) {
      console.error(`Error adding comment to alert ${id}:`, error);
      throw error;
    }
  }
  
  // Delete an alert
  async deleteAlert(id: string) {
    try {
      return this.apiService.delete(`/alerts/${id}`);
    } catch (error) {
      console.error(`Error deleting alert ${id}:`, error);
      throw error;
    }
  }
  
  // Get related alerts
  async getRelatedAlerts(id: string, limit: number = 5) {
    try {
      return this.apiService.get(`/alerts/${id}/related`, { limit });
    } catch (error) {
      console.error(`Error getting related alerts for ${id}:`, error);
      throw error;
    }
  }
  
  // Get alert statistics
  async getAlertStatistics(timeRange?: string) {
    try {
      return this.apiService.get('/alerts/statistics', { timeRange });
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      throw error;
    }
  }
  
  // Get alerts by severity
  async getAlertsBySeverity(timeRange?: string) {
    try {
      return this.apiService.get('/alerts/by-severity', { timeRange });
    } catch (error) {
      console.error('Error getting alerts by severity:', error);
      throw error;
    }
  }
  
  // Get alerts by status
  async getAlertsByStatus(timeRange?: string) {
    try {
      return this.apiService.get('/alerts/by-status', { timeRange });
    } catch (error) {
      console.error('Error getting alerts by status:', error);
      throw error;
    }
  }
  
  // Get alert trend data
  async getAlertTrend(timeRange?: string, interval: string = 'hour') {
    try {
      return this.apiService.get('/alerts/trend', { timeRange, interval });
    } catch (error) {
      console.error('Error getting alert trend:', error);
      throw error;
    }
  }
  
  // Get top affected entities
  async getTopAffectedEntities(timeRange?: string, limit: number = 10) {
    try {
      return this.apiService.get('/alerts/top-entities', { timeRange, limit });
    } catch (error) {
      console.error('Error getting top affected entities:', error);
      throw error;
    }
  }
  
  // Get MITRE ATT&CK mapping
  async getAlertsMitreMapping(timeRange?: string) {
    try {
      return this.apiService.get('/alerts/mitre-mapping', { timeRange });
    } catch (error) {
      console.error('Error getting MITRE mapping:', error);
      throw error;
    }
  }
  
  // Get alerts by geo location
  async getAlertsByGeoLocation(params?: { timeRange?: string, limit?: number }) {
    try {
      return this.apiService.get('/alerts/geo-location', params);
    } catch (error) {
      console.error('Error getting alerts by geo location:', error);
      throw error;
    }
  }
}

export default AlertService;
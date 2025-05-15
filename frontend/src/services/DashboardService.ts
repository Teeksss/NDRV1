import apiClient from '../utils/api-client';

export interface DashboardOptions {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
  interval?: string;
  limit?: number;
}

export class DashboardService {
  async getDashboardOverview(): Promise<any> {
    try {
      return await apiClient.get('/dashboard/overview');
    } catch (error) {
      console.error('Get dashboard overview error:', error);
      throw error;
    }
  }
  
  async getSecurityDashboard(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/security', options);
    } catch (error) {
      console.error('Get security dashboard error:', error);
      throw error;
    }
  }
  
  async getNetworkDashboard(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/network', options);
    } catch (error) {
      console.error('Get network dashboard error:', error);
      throw error;
    }
  }
  
  async getEntityDashboard(): Promise<any> {
    try {
      return await apiClient.get('/dashboard/entity');
    } catch (error) {
      console.error('Get entity dashboard error:', error);
      throw error;
    }
  }
  
  async getAlertsTrend(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/alerts/trend', options);
    } catch (error) {
      console.error('Get alerts trend error:', error);
      throw error;
    }
  }
  
  async getEventsTrend(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/events/trend', options);
    } catch (error) {
      console.error('Get events trend error:', error);
      throw error;
    }
  }
  
  async getTrafficTrend(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/traffic/trend', options);
    } catch (error) {
      console.error('Get traffic trend error:', error);
      throw error;
    }
  }
  
  async getTopAlerts(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/top-alerts', options);
    } catch (error) {
      console.error('Get top alerts error:', error);
      throw error;
    }
  }
  
  async getTopSources(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/top-sources', options);
    } catch (error) {
      console.error('Get top sources error:', error);
      throw error;
    }
  }
  
  async getTopDestinations(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/top-destinations', options);
    } catch (error) {
      console.error('Get top destinations error:', error);
      throw error;
    }
  }
  
  async getGeoDistribution(options: DashboardOptions = {}): Promise<any> {
    try {
      return await apiClient.get('/dashboard/geo-distribution', options);
    } catch (error) {
      console.error('Get geo distribution error:', error);
      throw error;
    }
  }
  
  async getSystemHealth(): Promise<any> {
    try {
      return await apiClient.get('/dashboard/system-health');
    } catch (error) {
      console.error('Get system health error:', error);
      throw error;
    }
  }
}

export default DashboardService;
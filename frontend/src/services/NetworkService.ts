import ApiService from './ApiService';
import { format } from 'date-fns';

export class NetworkService {
  private apiService: ApiService;
  
  constructor() {
    this.apiService = ApiService.getInstance();
  }
  
  // Get bandwidth usage
  async getBandwidthUsage(startDate?: Date | string, endDate?: Date | string, interval: string = 'hour') {
    try {
      let params: any = { interval };
      
      if (startDate) {
        params.startDate = typeof startDate === 'string' 
          ? startDate 
          : format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (endDate) {
        params.endDate = typeof endDate === 'string' 
          ? endDate 
          : format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/bandwidth', params);
    } catch (error) {
      console.error('Error getting bandwidth usage:', error);
      throw error;
    }
  }
  
  // Get protocol distribution
  async getProtocolDistribution(startDate?: Date | string, endDate?: Date | string) {
    try {
      let params: any = {};
      
      if (startDate) {
        params.startDate = typeof startDate === 'string' 
          ? startDate 
          : format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (endDate) {
        params.endDate = typeof endDate === 'string' 
          ? endDate 
          : format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/protocols', params);
    } catch (error) {
      console.error('Error getting protocol distribution:', error);
      throw error;
    }
  }
  
  // Get top source IPs
  async getTopSources(startDate?: Date | string, endDate?: Date | string, limit: number = 10) {
    try {
      let params: any = { limit };
      
      if (startDate) {
        params.startDate = typeof startDate === 'string' 
          ? startDate 
          : format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (endDate) {
        params.endDate = typeof endDate === 'string' 
          ? endDate 
          : format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/top-sources', params);
    } catch (error) {
      console.error('Error getting top sources:', error);
      throw error;
    }
  }
  
  // Get top destination IPs
  async getTopDestinations(startDate?: Date | string, endDate?: Date | string, limit: number = 10) {
    try {
      let params: any = { limit };
      
      if (startDate) {
        params.startDate = typeof startDate === 'string' 
          ? startDate 
          : format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (endDate) {
        params.endDate = typeof endDate === 'string' 
          ? endDate 
          : format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/top-destinations', params);
    } catch (error) {
      console.error('Error getting top destinations:', error);
      throw error;
    }
  }
  
  // Get geo distribution of traffic
  async getGeoDistribution(startDate?: Date | string, endDate?: Date | string) {
    try {
      let params: any = {};
      
      if (startDate) {
        params.startDate = typeof startDate === 'string' 
          ? startDate 
          : format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (endDate) {
        params.endDate = typeof endDate === 'string' 
          ? endDate 
          : format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/geo-distribution', params);
    } catch (error) {
      console.error('Error getting geo distribution:', error);
      throw error;
    }
  }
  
  // Get network flows
  async getFlows(params?: {
    startDate?: Date | string;
    endDate?: Date | string;
    protocol?: string;
    sourceIp?: string;
    destinationIp?: string;
    limit?: number;
    page?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    try {
      // Format dates if provided
      let formattedParams = { ...params };
      
      if (params?.startDate) {
        formattedParams.startDate = typeof params.startDate === 'string' 
          ? params.startDate 
          : format(params.startDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      if (params?.endDate) {
        formattedParams.endDate = typeof params.endDate === 'string' 
          ? params.endDate 
          : format(params.endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
      }
      
      return this.apiService.get('/network/flows', formattedParams);
    } catch (error) {
      console.error('Error getting network flows:', error);
      throw error;
    }
  }
  
  // Start network scan
  async startNetworkScan(scanData: {
    ipRange: string;
    options?: Record<string, any>;
  }) {
    try {
      return this.apiService.post('/network/scan', scanData);
    } catch (error) {
      console.error('Error starting network scan:', error);
      throw error;
    }
  }
  
  // Start port scan
  async startPortScan(scanData: {
    target: string;
    portRange: string;
    options?: Record<string, any>;
  }) {
    try {
      return this.apiService.post('/network/port-scan', scanData);
    } catch (error) {
      console.error('Error starting port scan:', error);
      throw error;
    }
  }
  
  // Get scan status
  async getScanStatus(id: string) {
    try {
      return this.apiService.get(`/network/scan/${id}/status`);
    } catch (error) {
      console.error(`Error getting scan status for ${id}:`, error);
      throw error;
    }
  }
  
  // Get scan results
  async getScanResults(id: string) {
    try {
      return this.apiService.get(`/network/scan/${id}/results`);
    } catch (error) {
      console.error(`Error getting scan results for ${id}:`, error);
      throw error;
    }
  }
  
  // Get scan history
  async getScanHistory(filters?: {
    type?: string;
    startDate?: Date | string;
    endDate?: Date | string;
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
      
      return this.apiService.get('/network/scan-history', formattedFilters);
    } catch (error) {
      console.error('Error getting scan history:', error);
      throw error;
    }
  }
  
  // Get network topology
  async getTopology() {
    try {
      return this.apiService.get('/network/topology');
    } catch (error) {
      console.error('Error getting network topology:', error);
      throw error;
    }
  }
  
  // Get network statistics
  async getNetworkStatistics(timeRange?: string) {
    try {
      return this.apiService.get('/network/statistics', { timeRange });
    } catch (error) {
      console.error('Error getting network statistics:', error);
      throw error;
    }
  }
}

export default NetworkService;
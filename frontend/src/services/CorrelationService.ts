import apiClient from '../utils/api-client';

export interface CorrelationRuleFilter {
  name?: string;
  enabled?: boolean;
  severity?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export class CorrelationService {
  async getCorrelationRules(filters: CorrelationRuleFilter = {}): Promise<any[]> {
    try {
      return await apiClient.get('/correlation-rules', filters);
    } catch (error) {
      console.error('Get correlation rules error:', error);
      throw error;
    }
  }
  
  async getCorrelationRuleById(id: string): Promise<any> {
    try {
      return await apiClient.get(`/correlation-rules/${id}`);
    } catch (error) {
      console.error(`Get correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async createCorrelationRule(ruleData: any): Promise<any> {
    try {
      return await apiClient.post('/correlation-rules', ruleData);
    } catch (error) {
      console.error('Create correlation rule error:', error);
      throw error;
    }
  }
  
  async updateCorrelationRule(id: string, ruleData: any): Promise<any> {
    try {
      return await apiClient.patch(`/correlation-rules/${id}`, ruleData);
    } catch (error) {
      console.error(`Update correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async deleteCorrelationRule(id: string): Promise<any> {
    try {
      return await apiClient.delete(`/correlation-rules/${id}`);
    } catch (error) {
      console.error(`Delete correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async enableCorrelationRule(id: string): Promise<any> {
    try {
      return await apiClient.patch(`/correlation-rules/${id}/enable`);
    } catch (error) {
      console.error(`Enable correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async disableCorrelationRule(id: string): Promise<any> {
    try {
      return await apiClient.patch(`/correlation-rules/${id}/disable`);
    } catch (error) {
      console.error(`Disable correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async testCorrelationRule(id: string, testData: any): Promise<any> {
    try {
      return await apiClient.post(`/correlation-rules/${id}/test`, testData);
    } catch (error) {
      console.error(`Test correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async getCorrelationRuleTemplates(): Promise<any[]> {
    try {
      return await apiClient.get('/correlation-rules/templates/all');
    } catch (error) {
      console.error('Get correlation rule templates error:', error);
      throw error;
    }
  }
  
  async getCorrelationRuleHistory(id: string): Promise<any[]> {
    try {
      return await apiClient.get(`/correlation-rules/${id}/history`);
    } catch (error) {
      console.error(`Get correlation rule ${id} history error:`, error);
      throw error;
    }
  }
  
  async cloneCorrelationRule(id: string): Promise<any> {
    try {
      return await apiClient.post(`/correlation-rules/${id}/clone`);
    } catch (error) {
      console.error(`Clone correlation rule ${id} error:`, error);
      throw error;
    }
  }
  
  async searchCorrelationRules(query: string): Promise<any[]> {
    try {
      return await apiClient.get('/correlation-rules', { query });
    } catch (error) {
      console.error('Search correlation rules error:', error);
      throw error;
    }
  }
}

export default CorrelationService;
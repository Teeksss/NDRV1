import apiClient from '../utils/api-client';

export interface EntityFilter {
  name?: string;
  type?: string;
  status?: string;
  ipAddress?: string;
  location?: string;
  sort?: string;
  order?: string;
  limit?: number;
  page?: number;
}

export class EntityService {
  async getEntities(filters: EntityFilter = {}): Promise<any[]> {
    try {
      return await apiClient.get('/entities', filters);
    } catch (error) {
      console.error('Get entities error:', error);
      throw error;
    }
  }
  
  async getEntityById(id: string): Promise<any> {
    try {
      return await apiClient.get(`/entities/${id}`);
    } catch (error) {
      console.error(`Get entity ${id} error:`, error);
      throw error;
    }
  }
  
  async createEntity(entityData: any): Promise<any> {
    try {
      return await apiClient.post('/entities', entityData);
    } catch (error) {
      console.error('Create entity error:', error);
      throw error;
    }
  }
  
  async updateEntity(id: string, entityData: any): Promise<any> {
    try {
      return await apiClient.patch(`/entities/${id}`, entityData);
    } catch (error) {
      console.error(`Update entity ${id} error:`, error);
      throw error;
    }
  }
  
  async deleteEntity(id: string): Promise<any> {
    try {
      return await apiClient.delete(`/entities/${id}`);
    } catch (error) {
      console.error(`Delete entity ${id} error:`, error);
      throw error;
    }
  }
  
  async getEntityAlerts(id: string, params: any = {}): Promise<any[]> {
    try {
      return await apiClient.get(`/entities/${id}/alerts`, params);
    } catch (error) {
      console.error(`Get entity ${id} alerts error:`, error);
      throw error;
    }
  }
  
  async getEntityEvents(id: string, params: any = {}): Promise<any[]> {
    try {
      return await apiClient.get(`/entities/${id}/events`, params);
    } catch (error) {
      console.error(`Get entity ${id} events error:`, error);
      throw error;
    }
  }
  
  async getEntityTrafficData(id: string, params: any = {}): Promise<any> {
    try {
      return await apiClient.get(`/entities/${id}/traffic`, params);
    } catch (error) {
      console.error(`Get entity ${id} traffic data error:`, error);
      throw error;
    }
  }
  
  async getRelationships(params: any = {}): Promise<any[]> {
    try {
      return await apiClient.get('/entities/relationships/all', params);
    } catch (error) {
      console.error('Get relationships error:', error);
      throw error;
    }
  }
  
  async createRelationship(entityId: string, relationshipData: any): Promise<any> {
    try {
      return await apiClient.post(`/entities/${entityId}/relationships`, relationshipData);
    } catch (error) {
      console.error(`Create relationship for entity ${entityId} error:`, error);
      throw error;
    }
  }
  
  async getEntityTypes(): Promise<string[]> {
    try {
      return await apiClient.get('/entities/types/all');
    } catch (error) {
      console.error('Get entity types error:', error);
      throw error;
    }
  }
  
  async getEntityDistribution(): Promise<any> {
    try {
      return await apiClient.get('/entities/stats/distribution');
    } catch (error) {
      console.error('Get entity distribution error:', error);
      throw error;
    }
  }
  
  async getStatusDistribution(): Promise<any> {
    try {
      return await apiClient.get('/entities/stats/status');
    } catch (error) {
      console.error('Get status distribution error:', error);
      throw error;
    }
  }
  
  async scanEntity(id: string): Promise<any> {
    try {
      return await apiClient.post(`/entities/${id}/scan`);
    } catch (error) {
      console.error(`Scan entity ${id} error:`, error);
      throw error;
    }
  }
  
  async getScanStatus(id: string): Promise<any> {
    try {
      return await apiClient.get(`/entities/${id}/scan/status`);
    } catch (error) {
      console.error(`Get scan status for entity ${id} error:`, error);
      throw error;
    }
  }
  
  async getScanHistory(id: string): Promise<any[]> {
    try {
      return await apiClient.get(`/entities/${id}/scan/history`);
    } catch (error) {
      console.error(`Get scan history for entity ${id} error:`, error);
      throw error;
    }
  }
}

export default EntityService;
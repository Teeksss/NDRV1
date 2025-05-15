import apiClient from '../utils/api-client';

export interface EventFilter {
  type?: string;
  entityId?: string;
  sourceIp?: string;
  destinationIp?: string;
  protocol?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: string;
  limit?: number;
  page?: number;
}

export class EventService {
  async getEvents(filters: EventFilter = {}): Promise<any[]> {
    try {
      return await apiClient.get('/events', filters);
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  }
  
  async getEventById(id: string): Promise<any> {
    try {
      return await apiClient.get(`/events/${id}`);
    } catch (error) {
      console.error(`Get event ${id} error:`, error);
      throw error;
    }
  }
  
  async getEventsByIds(ids: string[]): Promise<any[]> {
    try {
      return await apiClient.get('/events/batch', { ids: ids.join(',') });
    } catch (error) {
      console.error('Get events by IDs error:', error);
      throw error;
    }
  }
  
  async getRelatedEvents(id: string, limit?: number): Promise<any[]> {
    try {
      return await apiClient.get(`/events/${id}/related`, { limit });
    } catch (error) {
      console.error(`Get related events for ${id} error:`, error);
      throw error;
    }
  }
  
  async deleteEvent(id: string): Promise<any> {
    try {
      return await apiClient.delete(`/events/${id}`);
    } catch (error) {
      console.error(`Delete event ${id} error:`, error);
      throw error;
    }
  }
  
  async getEventTrend(
    startDate?: string,
    endDate?: string,
    interval?: string
  ): Promise<any[]> {
    try {
      return await apiClient.get('/events/stats/trend', {
        startDate,
        endDate,
        interval
      });
    } catch (error) {
      console.error('Get event trend error:', error);
      throw error;
    }
  }
  
  async getEventsByType(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      return await apiClient.get('/events/stats/type', {
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Get events by type error:', error);
      throw error;
    }
  }
  
  async getTopProtocols(limit?: number, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      return await apiClient.get('/events/stats/protocols', {
        limit,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Get top protocols error:', error);
      throw error;
    }
  }
  
  async getTopSourceIps(limit?: number, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      return await apiClient.get('/events/stats/source-ips', {
        limit,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Get top source IPs error:', error);
      throw error;
    }
  }
  
  async getTopDestinationIps(limit?: number, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      return await apiClient.get('/events/stats/destination-ips', {
        limit,
        startDate,
        endDate
      });
    } catch (error) {
      console.error('Get top destination IPs error:', error);
      throw error;
    }
  }
  
  async createEvent(eventData: any): Promise<any> {
    try {
      return await apiClient.post('/events', eventData);
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  }
}

export default EventService;
import apiClient from '../utils/api-client';

export interface NotificationFilter {
  read?: boolean;
  type?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: string;
  limit?: number;
  page?: number;
}

export class NotificationService {
  async getNotifications(filters: NotificationFilter = {}): Promise<any[]> {
    try {
      return await apiClient.get('/notifications', filters);
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }
  
  async getNotificationById(id: string): Promise<any> {
    try {
      return await apiClient.get(`/notifications/${id}`);
    } catch (error) {
      console.error(`Get notification ${id} error:`, error);
      throw error;
    }
  }
  
  async markAsRead(ids: string[]): Promise<any> {
    try {
      return await apiClient.patch('/notifications/mark-as-read', { ids });
    } catch (error) {
      console.error('Mark notifications as read error:', error);
      throw error;
    }
  }
  
  async markAllAsRead(): Promise<any> {
    try {
      return await apiClient.patch('/notifications/mark-all-as-read');
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw error;
    }
  }
  
  async deleteNotifications(ids: string[]): Promise<any> {
    try {
      return await apiClient.delete('/notifications', { data: { ids } });
    } catch (error) {
      console.error('Delete notifications error:', error);
      throw error;
    }
  }
  
  async deleteAllNotifications(): Promise<any> {
    try {
      return await apiClient.delete('/notifications/all');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      throw error;
    }
  }
  
  async getUnreadCount(): Promise<number> {
    try {
      const result = await apiClient.get('/notifications/unread-count');
      return result.count;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }
  
  async updateNotificationSettings(settings: any): Promise<any> {
    try {
      return await apiClient.patch('/user/notification-settings', settings);
    } catch (error) {
      console.error('Update notification settings error:', error);
      throw error;
    }
  }
  
  async getNotificationSettings(): Promise<any> {
    try {
      return await apiClient.get('/user/notification-settings');
    } catch (error) {
      console.error('Get notification settings error:', error);
      throw error;
    }
  }
}

export default NotificationService;
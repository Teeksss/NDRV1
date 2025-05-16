import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { Alert } from '@/models/Alert';
import { Severity } from '@/types/severity';

interface GetAlertsParams {
  limit?: number;
  offset?: number;
  severity?: Severity | 'all';
  status?: 'open' | 'closed' | 'all';
  from?: string;
  to?: string;
  search?: string;
  sortBy?: 'timestamp' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

interface GetAlertsResponse {
  total: number;
  alerts: Alert[];
}

class AlertService {
  /**
   * Uyarıları getir
   * @param params Filtreleme, sayfalama ve sıralama parametreleri
   * @returns Uyarı listesi ve toplam sayı
   */
  public static async getAlerts(params: GetAlertsParams = {}): Promise<GetAlertsResponse> {
    try {
      // All parametresi API'ye gönderilmemeli
      const apiParams = { ...params };
      if (apiParams.severity === 'all') delete apiParams.severity;
      if (apiParams.status === 'all') delete apiParams.status;

      const response = await axios.get<GetAlertsResponse>(`${API_BASE_URL}/alerts`, {
        params: apiParams
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw new Error('Failed to fetch alerts. Please try again.');
    }
  }

  /**
   * Belirli bir uyarının detaylarını getir
   * @param alertId Uyarı ID
   * @returns Uyarı detayları
   */
  public static async getAlert(alertId: string): Promise<Alert> {
    try {
      const response = await axios.get<Alert>(`${API_BASE_URL}/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch alert ${alertId}:`, error);
      throw new Error('Failed to fetch alert details. Please try again.');
    }
  }

  /**
   * Uyarı durumunu güncelle
   * @param alertId Uyarı ID
   * @param status Yeni durum
   * @returns Güncellenmiş uyarı
   */
  public static async updateAlertStatus(
    alertId: string, 
    status: 'open' | 'closed'
  ): Promise<Alert> {
    try {
      const response = await axios.patch<Alert>(`${API_BASE_URL}/alerts/${alertId}/status`, {
        status
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to update alert ${alertId} status:`, error);
      throw new Error('Failed to update alert status. Please try again.');
    }
  }

  /**
   * Uyarıya not ekle
   * @param alertId Uyarı ID
   * @param notes Eklenecek notlar
   * @returns Güncellenmiş uyarı
   */
  public static async addAlertNotes(alertId: string, notes: string): Promise<Alert> {
    try {
      const response = await axios.post<Alert>(`${API_BASE_URL}/alerts/${alertId}/notes`, {
        notes
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to add notes to alert ${alertId}:`, error);
      throw new Error('Failed to add notes to alert. Please try again.');
    }
  }

  /**
   * Uyarıyı atama
   * @param alertId Uyarı ID
   * @param userId Atanacak kullanıcı ID
   * @returns Güncellenmiş uyarı
   */
  public static async assignAlert(alertId: string, userId: string): Promise<Alert> {
    try {
      const response = await axios.post<Alert>(`${API_BASE_URL}/alerts/${alertId}/assign`, {
        userId
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to assign alert ${alertId}:`, error);
      throw new Error('Failed to assign alert. Please try again.');
    }
  }

  /**
   * Uyarı istatistiklerini getir
   * @param timeframe Zaman dilimi
   * @returns Uyarı istatistikleri
   */
  public static async getAlertStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/alerts/stats`, {
        params: { timeframe }
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch alert statistics:', error);
      throw new Error('Failed to fetch alert statistics. Please try again.');
    }
  }
}

export { AlertService };
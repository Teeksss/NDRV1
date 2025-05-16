import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { Anomaly, AnomalyGroup, AnomalyType, AnomalyStatus } from '@/models/Anomaly';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface AnomalyDetectionParams {
  timeRange: TimeRange;
  types?: AnomalyType[];
  minScore?: number;
  status?: AnomalyStatus;
  deviceIds?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Anomali tespiti ve yönetimi için servis sınıfı
 * Bu servis, anormal davranışları tespit etme ve yönetme işlevlerini sağlar
 */
class AnomalyDetectionService {
  /**
   * Anomalileri getirir
   * @param params Sorgu parametreleri
   * @returns Anomali listesi
   */
  public static async getAnomalies(params: AnomalyDetectionParams): Promise<Anomaly[]> {
    try {
      logger.debug('Fetching anomalies with params:', params);
      
      const response = await axios.get<Anomaly[]>(`${API_BASE_URL}/anomalies`, {
        params: {
          timeRange: params.timeRange,
          types: params.types?.join(','),
          minScore: params.minScore,
          status: params.status,
          deviceIds: params.deviceIds?.join(','),
          limit: params.limit || 100,
          offset: params.offset || 0
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch anomalies:', error);
      throw new Error('Anomali verileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomalileri gruplar halinde getirir
   * @param timeRange Zaman aralığı
   * @returns Anomali grupları
   */
  public static async getAnomalyGroups(timeRange: TimeRange): Promise<AnomalyGroup[]> {
    try {
      logger.debug('Fetching anomaly groups for time range:', timeRange);
      
      const response = await axios.get<AnomalyGroup[]>(`${API_BASE_URL}/anomalies/groups`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch anomaly groups:', error);
      throw new Error('Anomali grupları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir anomalinin detaylarını getirir
   * @param anomalyId Anomali ID
   * @returns Anomali detayları
   */
  public static async getAnomalyDetails(anomalyId: string): Promise<Anomaly> {
    try {
      logger.debug(`Fetching details for anomaly ${anomalyId}`);
      
      const response = await axios.get<Anomaly>(`${API_BASE_URL}/anomalies/${anomalyId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch details for anomaly ${anomalyId}:`, error);
      throw new Error('Anomali detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomalinin durumunu günceller
   * @param anomalyId Anomali ID
   * @param status Yeni durum
   * @param notes Notlar (opsiyonel)
   * @returns Güncellenmiş anomali
   */
  public static async updateAnomalyStatus(
    anomalyId: string, 
    status: AnomalyStatus,
    notes?: string
  ): Promise<Anomaly> {
    try {
      logger.debug(`Updating status for anomaly ${anomalyId} to ${status}`);
      
      const response = await axios.patch<Anomaly>(`${API_BASE_URL}/anomalies/${anomalyId}/status`, {
        status,
        notes
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to update status for anomaly ${anomalyId}:`, error);
      throw new Error('Anomali durumu güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomalinin geçerliliğini doğrular veya yanlış pozitif olarak işaretler
   * @param anomalyId Anomali ID
   * @param isValid Geçerli mi?
   * @param reason Neden (opsiyonel)
   * @returns Güncellenmiş anomali
   */
  public static async validateAnomaly(
    anomalyId: string, 
    isValid: boolean,
    reason?: string
  ): Promise<Anomaly> {
    try {
      logger.debug(`Validating anomaly ${anomalyId}, isValid: ${isValid}`);
      
      const response = await axios.post<Anomaly>(`${API_BASE_URL}/anomalies/${anomalyId}/validate`, {
        isValid,
        reason
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to validate anomaly ${anomalyId}:`, error);
      throw new Error('Anomali doğrulanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomalileri otomatik gruplamak için analiz yapar
   * @param timeRange Zaman aralığı
   * @param minScore Minimum benzerlik skoru
   * @returns Anomali grupları
   */
  public static async analyzeAnomalyGroups(
    timeRange: TimeRange,
    minScore: number = 0.7
  ): Promise<AnomalyGroup[]> {
    try {
      logger.debug(`Analyzing anomaly groups for time range: ${timeRange}, minScore: ${minScore}`);
      
      const response = await axios.post<AnomalyGroup[]>(`${API_BASE_URL}/anomalies/analyze`, {
        timeRange,
        minScore
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze anomaly groups:', error);
      throw new Error('Anomali grubu analizi yapılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomali tespiti modeli ayarlarını getirir
   * @returns Model ayarları
   */
  public static async getModelSettings(): Promise<any> {
    try {
      logger.debug('Fetching anomaly detection model settings');
      
      const response = await axios.get(`${API_BASE_URL}/anomalies/settings`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch anomaly detection model settings:', error);
      throw new Error('Anomali tespiti model ayarları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomali tespiti model ayarlarını günceller
   * @param settings Yeni ayarlar
   * @returns Güncellenmiş ayarlar
   */
  public static async updateModelSettings(settings: any): Promise<any> {
    try {
      logger.debug('Updating anomaly detection model settings', settings);
      
      const response = await axios.put(`${API_BASE_URL}/anomalies/settings`, settings);
      return response.data;
    } catch (error) {
      logger.error('Failed to update anomaly detection model settings:', error);
      throw new Error('Anomali tespiti model ayarları güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomali tespiti modelini yeniden eğitir
   * @returns Eğitim durumu
   */
  public static async retrainModel(): Promise<any> {
    try {
      logger.debug('Retraining anomaly detection model');
      
      const response = await axios.post(`${API_BASE_URL}/anomalies/retrain`);
      return response.data;
    } catch (error) {
      logger.error('Failed to retrain anomaly detection model:', error);
      throw new Error('Anomali tespiti modeli yeniden eğitilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomali tespiti model performans metriklerini getirir
   * @returns Performans metrikleri
   */
  public static async getModelPerformance(): Promise<any> {
    try {
      logger.debug('Fetching anomaly detection model performance');
      
      const response = await axios.get(`${API_BASE_URL}/anomalies/performance`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch anomaly detection model performance:', error);
      throw new Error('Anomali tespiti model performansı alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { AnomalyDetectionService };
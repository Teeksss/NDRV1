import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { Anomaly, AnomalyTrainingData, AnomalyModelConfig } from '@/models/Anomaly';
import { logger } from '@/utils/logger';

/**
 * Makine öğrenimi tabanlı anomali tespiti için servis sınıfı
 * Bu servis, gelişmiş ML algoritmalarıyla ağ trafiğinde anomalileri tespit eder
 */
class MLAnomalyService {
  /**
   * Mevcut makine öğrenimi modellerini getirir
   * @returns Anomali tespit modelleri
   */
  public static async getModels(): Promise<AnomalyModelConfig[]> {
    try {
      logger.debug('Fetching ML anomaly detection models');
      
      const response = await axios.get<AnomalyModelConfig[]>(`${API_BASE_URL}/ml/anomaly/models`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch ML anomaly detection models:', error);
      throw new Error('Makine öğrenimi modelleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir modelin detaylarını getirir
   * @param modelId Model ID
   * @returns Model detayları
   */
  public static async getModelById(modelId: string): Promise<AnomalyModelConfig> {
    try {
      logger.debug(`Fetching ML anomaly detection model ${modelId}`);
      
      const response = await axios.get<AnomalyModelConfig>(`${API_BASE_URL}/ml/anomaly/models/${modelId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch ML anomaly detection model ${modelId}:`, error);
      throw new Error('Makine öğrenimi modeli alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir modeli eğitmek için kullanılan veri setini getirir
   * @param modelId Model ID
   * @returns Eğitim veri seti
   */
  public static async getTrainingData(modelId: string): Promise<AnomalyTrainingData[]> {
    try {
      logger.debug(`Fetching training data for model ${modelId}`);
      
      const response = await axios.get<AnomalyTrainingData[]>(`${API_BASE_URL}/ml/anomaly/models/${modelId}/data`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch training data for model ${modelId}:`, error);
      throw new Error('Eğitim verisi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir modelin eğitim sürecini başlatır
   * @param modelId Model ID
   * @param options Eğitim seçenekleri
   * @returns Eğitim durumu
   */
  public static async trainModel(modelId: string, options?: any): Promise<any> {
    try {
      logger.debug(`Training ML anomaly detection model ${modelId}`);
      
      const response = await axios.post(`${API_BASE_URL}/ml/anomaly/models/${modelId}/train`, options || {});
      return response.data;
    } catch (error) {
      logger.error(`Failed to train ML anomaly detection model ${modelId}:`, error);
      throw new Error('Model eğitimi başlatılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Eğitim sürecinin durumunu kontrol eder
   * @param modelId Model ID
   * @param trainingId Eğitim ID
   * @returns Eğitim durumu
   */
  public static async getTrainingStatus(modelId: string, trainingId: string): Promise<any> {
    try {
      logger.debug(`Checking training status for model ${modelId}, training ${trainingId}`);
      
      const response = await axios.get(`${API_BASE_URL}/ml/anomaly/models/${modelId}/train/${trainingId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to check training status for model ${modelId}:`, error);
      throw new Error('Eğitim durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Veri setinde anomali tespiti yapar
   * @param modelId Model ID
   * @param data Analiz edilecek veri
   * @returns Tespit edilen anomaliler
   */
  public static async detectAnomalies(modelId: string, data: any): Promise<Anomaly[]> {
    try {
      logger.debug(`Detecting anomalies using model ${modelId}`);
      
      const response = await axios.post<Anomaly[]>(`${API_BASE_URL}/ml/anomaly/detect/${modelId}`, {
        data
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to detect anomalies using model ${modelId}:`, error);
      throw new Error('Anomali tespiti yapılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Zaman aralığındaki anomalileri tahmin eder
   * @param modelId Model ID
   * @param timeRange Zaman aralığı
   * @param options Tahmin seçenekleri
   * @returns Tahmin edilen anomaliler
   */
  public static async forecastAnomalies(modelId: string, timeRange: TimeRange, options?: any): Promise<any> {
    try {
      logger.debug(`Forecasting anomalies using model ${modelId} for time range:`, timeRange);
      
      const response = await axios.post(`${API_BASE_URL}/ml/anomaly/forecast/${modelId}`, {
        timeRange,
        ...options
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to forecast anomalies using model ${modelId}:`, error);
      throw new Error('Anomali tahmini yapılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni model oluşturur
   * @param model Model konfigürasyonu
   * @returns Oluşturulan model
   */
  public static async createModel(model: Partial<AnomalyModelConfig>): Promise<AnomalyModelConfig> {
    try {
      logger.debug('Creating new ML anomaly detection model');
      
      const response = await axios.post<AnomalyModelConfig>(`${API_BASE_URL}/ml/anomaly/models`, model);
      return response.data;
    } catch (error) {
      logger.error('Failed to create ML anomaly detection model:', error);
      throw new Error('Model oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Modeli günceller
   * @param modelId Model ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş model
   */
  public static async updateModel(modelId: string, updates: Partial<AnomalyModelConfig>): Promise<AnomalyModelConfig> {
    try {
      logger.debug(`Updating ML anomaly detection model ${modelId}`);
      
      const response = await axios.put<AnomalyModelConfig>(`${API_BASE_URL}/ml/anomaly/models/${modelId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update ML anomaly detection model ${modelId}:`, error);
      throw new Error('Model güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Modeli siler
   * @param modelId Model ID
   * @returns Silme durumu
   */
  public static async deleteModel(modelId: string): Promise<any> {
    try {
      logger.debug(`Deleting ML anomaly detection model ${modelId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/ml/anomaly/models/${modelId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete ML anomaly detection model ${modelId}:`, error);
      throw new Error('Model silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Model performans metriklerini getirir
   * @param modelId Model ID
   * @returns Performans metrikleri
   */
  public static async getModelPerformance(modelId: string): Promise<any> {
    try {
      logger.debug(`Fetching performance metrics for model ${modelId}`);
      
      const response = await axios.get(`${API_BASE_URL}/ml/anomaly/models/${modelId}/performance`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch performance metrics for model ${modelId}:`, error);
      throw new Error('Model performans metrikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anomali türlerinin dağılımını getirir
   * @param timeRange Zaman aralığı
   * @returns Anomali türleri dağılımı
   */
  public static async getAnomalyTypeDistribution(timeRange: TimeRange): Promise<any> {
    try {
      logger.debug('Fetching anomaly type distribution for time range:', timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/ml/anomaly/distribution`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch anomaly type distribution:', error);
      throw new Error('Anomali türü dağılımı alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { MLAnomalyService };
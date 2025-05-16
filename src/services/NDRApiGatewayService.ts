import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { logger } from '@/utils/logger';

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  requiresAuth: boolean;
  requiredPermissions: string[];
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  responses: {
    code: number;
    description: string;
    example?: any;
  }[];
  tags: string[];
  deprecated: boolean;
  version: string;
}

interface ApiConsumer {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  secret?: string;
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'inactive' | 'revoked';
  permissions: string[];
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstSize: number;
  };
  ipRestrictions: {
    enabled: boolean;
    allowedIps: string[];
  };
}

interface ApiKeyUsage {
  id: string;
  apiKey: string;
  consumer: string;
  endpoint: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  responseCode: number;
  responseTime: number;
}

/**
 * NDR API Gateway için servis sınıfı
 * Bu servis, NDR API'larını yönetir ve API erişimini kontrol eder
 */
class NDRApiGatewayService {
  /**
   * Tüm API endpointlerini getirir
   * @returns API endpoint listesi
   */
  public static async getApiEndpoints(): Promise<ApiEndpoint[]> {
    try {
      logger.debug('Fetching API endpoints');
      
      const response = await axios.get<ApiEndpoint[]>(`${API_BASE_URL}/api-gateway/endpoints`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch API endpoints:', error);
      throw new Error('API endpointleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir API endpointinin detaylarını getirir
   * @param endpointId Endpoint ID
   * @returns Endpoint detayları
   */
  public static async getApiEndpointById(endpointId: string): Promise<ApiEndpoint> {
    try {
      logger.debug(`Fetching API endpoint ${endpointId}`);
      
      const response = await axios.get<ApiEndpoint>(`${API_BASE_URL}/api-gateway/endpoints/${endpointId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch API endpoint ${endpointId}:`, error);
      throw new Error('API endpoint detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm API tüketicilerini getirir
   * @returns API tüketici listesi
   */
  public static async getApiConsumers(): Promise<ApiConsumer[]> {
    try {
      logger.debug('Fetching API consumers');
      
      const response = await axios.get<ApiConsumer[]>(`${API_BASE_URL}/api-gateway/consumers`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch API consumers:', error);
      throw new Error('API tüketicileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir API tüketicisinin detaylarını getirir
   * @param consumerId Tüketici ID
   * @returns Tüketici detayları
   */
  public static async getApiConsumerById(consumerId: string): Promise<ApiConsumer> {
    try {
      logger.debug(`Fetching API consumer ${consumerId}`);
      
      const response = await axios.get<ApiConsumer>(`${API_BASE_URL}/api-gateway/consumers/${consumerId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch API consumer ${consumerId}:`, error);
      throw new Error('API tüketicisi detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir API tüketicisi oluşturur
   * @param consumer Tüketici bilgileri
   * @returns Oluşturulan tüketici
   */
  public static async createApiConsumer(consumer: Partial<ApiConsumer>): Promise<ApiConsumer> {
    try {
      logger.debug('Creating new API consumer');
      
      const response = await axios.post<ApiConsumer>(`${API_BASE_URL}/api-gateway/consumers`, consumer);
      return response.data;
    } catch (error) {
      logger.error('Failed to create API consumer:', error);
      throw new Error('API tüketicisi oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir API tüketicisini günceller
   * @param consumerId Tüketici ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş tüketici
   */
  public static async updateApiConsumer(consumerId: string, updates: Partial<ApiConsumer>): Promise<ApiConsumer> {
    try {
      logger.debug(`Updating API consumer ${consumerId}`);
      
      const response = await axios.put<ApiConsumer>(`${API_BASE_URL}/api-gateway/consumers/${consumerId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update API consumer ${consumerId}:`, error);
      throw new Error('API tüketicisi güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir API tüketicisini siler
   * @param consumerId Tüketici ID
   * @returns Silme durumu
   */
  public static async deleteApiConsumer(consumerId: string): Promise<any> {
    try {
      logger.debug(`Deleting API consumer ${consumerId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/api-gateway/consumers/${consumerId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete API consumer ${consumerId}:`, error);
      throw new Error('API tüketicisi silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir API tüketicisi için yeni bir API anahtarı oluşturur
   * @param consumerId Tüketici ID
   * @returns Yeni API anahtarı
   */
  public static async regenerateApiKey(consumerId: string): Promise<{ apiKey: string; secret?: string }> {
    try {
      logger.debug(`Regenerating API key for consumer ${consumerId}`);
      
      const response = await axios.post<{ apiKey: string; secret?: string }>(`${API_BASE_URL}/api-gateway/consumers/${consumerId}/keys`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to regenerate API key for consumer ${consumerId}:`, error);
      throw new Error('API anahtarı yeniden oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir API tüketicisinin API anahtarını iptal eder
   * @param consumerId Tüketici ID
   * @returns İptal durumu
   */
  public static async revokeApiKey(consumerId: string): Promise<any> {
    try {
      logger.debug(`Revoking API key for consumer ${consumerId}`);
      
      const response = await axios.post(`${API_BASE_URL}/api-gateway/consumers/${consumerId}/revoke`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to revoke API key for consumer ${consumerId}:`, error);
      throw new Error('API anahtarı iptal edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * API kullanım istatistiklerini getirir
   * @param days Son kaç günün istatistikleri (varsayılan: 7)
   * @returns API kullanım istatistikleri
   */
  public static async getApiUsageStats(days: number = 7): Promise<any> {
    try {
      logger.debug(`Fetching API usage stats for the last ${days} days`);
      
      const response = await axios.get(`${API_BASE_URL}/api-gateway/stats`, {
        params: { days }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch API usage stats:', error);
      throw new Error('API kullanım istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir API tüketicisi için kullanım istatistiklerini getirir
   * @param consumerId Tüketici ID
   * @param days Son kaç günün istatistikleri (varsayılan: 7)
   * @returns Tüketici kullanım istatistikleri
   */
  public static async getConsumerUsageStats(consumerId: string, days: number = 7): Promise<any> {
    try {
      logger.debug(`Fetching usage stats for API consumer ${consumerId} for the last ${days} days`);
      
      const response = await axios.get(`${API_BASE_URL}/api-gateway/consumers/${consumerId}/stats`, {
        params: { days }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch usage stats for API consumer ${consumerId}:`, error);
      throw new Error('API tüketicisi kullanım istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * API anahtarı kullanım geçmişini getirir
   * @param apiKey API anahtarı
   * @param limit Maksimum kayıt sayısı
   * @returns Kullanım geçmişi
   */
  public static async getApiKeyUsageHistory(apiKey: string, limit: number = 100): Promise<ApiKeyUsage[]> {
    try {
      logger.debug(`Fetching usage history for API key ${apiKey}`);
      
      const response = await axios.get<ApiKeyUsage[]>(`${API_BASE_URL}/api-gateway/keys/${apiKey}/history`, {
        params: { limit }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch usage history for API key ${apiKey}:`, error);
      throw new Error('API anahtarı kullanım geçmişi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * API gateway sağlık durumunu kontrol eder
   * @returns Sağlık durumu
   */
  public static async getApiGatewayHealth(): Promise<any> {
    try {
      logger.debug('Checking API gateway health');
      
      const response = await axios.get(`${API_BASE_URL}/api-gateway/health`);
      return response.data;
    } catch (error) {
      logger.error('Failed to check API gateway health:', error);
      throw new Error('API gateway sağlık durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * API OpenAPI/Swagger dokümantasyonunu getirir
   * @returns OpenAPI/Swagger dokümantasyonu
   */
  public static async getApiDocs(): Promise<any> {
    try {
      logger.debug('Fetching API documentation');
      
      const response = await axios.get(`${API_BASE_URL}/api-gateway/docs`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch API documentation:', error);
      throw new Error('API dokümantasyonu alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { 
  NDRApiGatewayService,
  ApiEndpoint,
  ApiConsumer,
  ApiKeyUsage
};
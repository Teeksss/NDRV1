import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { NetworkNode, NetworkLink, NetworkMap, NetworkPath, DeviceType } from '@/models/Network';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface NetworkMapParams {
  timeRange?: TimeRange;
  deviceIds?: string[];
  includeInactive?: boolean;
  layout?: 'auto' | 'hierarchical' | 'radial' | 'force';
  depth?: number;
  details?: 'basic' | 'standard' | 'full';
}

interface NetworkPathParams {
  sourceId: string;
  targetId: string;
  timeRange?: TimeRange;
  protocol?: string;
}

/**
 * Ağ haritası ve topoloji yönetimi için servis sınıfı
 * Bu servis, ağ topolojisi, cihazlar arası bağlantılar ve ağ yolları ile ilgili işlevler sağlar
 */
class NetworkMapService {
  /**
   * Ağ haritasını getirir
   * @param params Sorgu parametreleri
   * @returns Ağ haritası
   */
  public static async getNetworkMap(params: NetworkMapParams = {}): Promise<NetworkMap> {
    try {
      logger.debug('Fetching network map with params:', params);
      
      const response = await axios.get<NetworkMap>(`${API_BASE_URL}/network/map`, {
        params: {
          timeRange: params.timeRange,
          deviceIds: params.deviceIds?.join(','),
          includeInactive: params.includeInactive,
          layout: params.layout || 'auto',
          depth: params.depth,
          details: params.details || 'standard'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network map:', error);
      throw new Error('Ağ haritası alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihaz için ağ haritasını getirir
   * @param deviceId Cihaz ID
   * @param depth Derinlik seviyesi (1-10)
   * @param includeInactive Inaktif cihazlar dahil edilsin mi?
   * @returns Ağ haritası
   */
  public static async getDeviceNetworkMap(
    deviceId: string, 
    depth: number = 2,
    includeInactive: boolean = false
  ): Promise<NetworkMap> {
    try {
      logger.debug(`Fetching network map for device ${deviceId} with depth ${depth}`);
      
      const response = await axios.get<NetworkMap>(`${API_BASE_URL}/network/map/device/${deviceId}`, {
        params: {
          depth,
          includeInactive
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch network map for device ${deviceId}:`, error);
      throw new Error('Cihaz ağ haritası alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * İki cihaz arasındaki ağ yolunu getirir
   * @param params Sorgu parametreleri
   * @returns Ağ yolu
   */
  public static async getNetworkPath(params: NetworkPathParams): Promise<NetworkPath> {
    try {
      logger.debug('Fetching network path with params:', params);
      
      const response = await axios.get<NetworkPath>(`${API_BASE_URL}/network/path`, {
        params: {
          sourceId: params.sourceId,
          targetId: params.targetId,
          timeRange: params.timeRange,
          protocol: params.protocol
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network path:', error);
      throw new Error('Ağ yolu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağ topolojisini günceller
   * @returns Güncelleme durumu
   */
  public static async updateNetworkTopology(): Promise<{ status: string; timestamp: string }> {
    try {
      logger.debug('Triggering network topology update');
      
      const response = await axios.post(`${API_BASE_URL}/network/topology/update`);
      return response.data;
    } catch (error) {
      logger.error('Failed to update network topology:', error);
      throw new Error('Ağ topolojisi güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Cihazlar arası bağlantı durumunu getirir
   * @param deviceId1 Birinci cihaz ID
   * @param deviceId2 İkinci cihaz ID
   * @returns Bağlantı durumu
   */
  public static async getConnectionStatus(deviceId1: string, deviceId2: string): Promise<any> {
    try {
      logger.debug(`Fetching connection status between devices ${deviceId1} and ${deviceId2}`);
      
      const response = await axios.get(`${API_BASE_URL}/network/connections/status`, {
        params: {
          deviceId1,
          deviceId2
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch connection status between devices ${deviceId1} and ${deviceId2}:`, error);
      throw new Error('Bağlantı durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm ağ segmentlerini getirir
   * @returns Ağ segmentleri
   */
  public static async getNetworkSegments(): Promise<any[]> {
    try {
      logger.debug('Fetching network segments');
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/network/segments`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network segments:', error);
      throw new Error('Ağ segmentleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağdaki tüm cihaz tiplerini getirir
   * @returns Cihaz tipleri
   */
  public static async getDeviceTypes(): Promise<DeviceType[]> {
    try {
      logger.debug('Fetching device types');
      
      const response = await axios.get<DeviceType[]>(`${API_BASE_URL}/network/device-types`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch device types:', error);
      throw new Error('Cihaz tipleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağ topolojisi tarihçesini getirir
   * @param startDate Başlangıç tarihi
   * @param endDate Bitiş tarihi
   * @returns Topoloji değişiklikleri
   */
  public static async getTopologyHistory(startDate: string, endDate: string): Promise<any[]> {
    try {
      logger.debug(`Fetching topology history from ${startDate} to ${endDate}`);
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/network/topology/history`, {
        params: {
          startDate,
          endDate
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch topology history:', error);
      throw new Error('Topoloji tarihçesi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Topolojideki anomalileri getirir
   * @param timeRange Zaman aralığı
   * @returns Topoloji anomalileri
   */
  public static async getTopologyAnomalies(timeRange: TimeRange): Promise<any[]> {
    try {
      logger.debug(`Fetching topology anomalies for time range: ${timeRange}`);
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/network/topology/anomalies`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch topology anomalies:', error);
      throw new Error('Topoloji anomalileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { NetworkMapService };
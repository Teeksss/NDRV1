import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TrafficData, TrafficSummary, TrafficProtocol, TrafficSource } from '@/models/TrafficData';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';
import { formatBytes, formatDateRange } from '@/utils/formatters';

interface TrafficAnalysisParams {
  timeRange: TimeRange;
  deviceIds?: string[];
  protocols?: string[];
  sourceIps?: string[];
  destinationIps?: string[];
  aggregation?: 'minute' | 'hour' | 'day';
  limit?: number;
}

interface TrafficTopItemsParams {
  timeRange: TimeRange;
  category: 'protocols' | 'sources' | 'destinations' | 'applications';
  limit?: number;
}

interface BandwidthUsageParams {
  timeRange: TimeRange;
  deviceIds?: string[];
  protocols?: string[];
  aggregation?: 'minute' | 'hour' | 'day';
}

/**
 * Ağ trafiği analizi için servis sınıfı
 * Bu servis, ağ trafiği verileri üzerinde analiz ve sorgulama işlemleri yapar
 */
class TrafficAnalysisService {
  /**
   * Belirli bir zaman aralığı için trafik verilerini getirir
   * @param params Sorgu parametreleri
   * @returns Trafik verileri
   */
  public static async getTrafficData(params: TrafficAnalysisParams): Promise<TrafficData[]> {
    try {
      logger.debug('Fetching traffic data with params:', params);
      
      const response = await axios.get<TrafficData[]>(`${API_BASE_URL}/traffic/data`, {
        params: {
          timeRange: params.timeRange,
          deviceIds: params.deviceIds?.join(','),
          protocols: params.protocols?.join(','),
          sourceIps: params.sourceIps?.join(','),
          destinationIps: params.destinationIps?.join(','),
          aggregation: params.aggregation || this.getDefaultAggregation(params.timeRange),
          limit: params.limit || 1000
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch traffic data:', error);
      throw new Error('Ağ trafiği verileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Trafik özet bilgilerini getirir
   * @param timeRange Zaman aralığı
   * @returns Trafik özeti
   */
  public static async getTrafficSummary(timeRange: TimeRange): Promise<TrafficSummary> {
    try {
      logger.debug('Fetching traffic summary for time range:', timeRange);
      
      const response = await axios.get<TrafficSummary>(`${API_BASE_URL}/traffic/summary`, {
        params: { timeRange }
      });
      
      // Veri formatlaması
      const data = response.data;
      data.formattedTotalBytes = formatBytes(data.totalBytes);
      data.formattedDateRange = formatDateRange(timeRange);
      
      return data;
    } catch (error) {
      logger.error('Failed to fetch traffic summary:', error);
      throw new Error('Trafik özeti alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * En çok kullanılan protokolleri, kaynakları veya hedefleri getirir
   * @param params Sorgu parametreleri
   * @returns En çok kullanılan öğeler
   */
  public static async getTopItems(params: TrafficTopItemsParams): Promise<TrafficProtocol[] | TrafficSource[]> {
    try {
      logger.debug('Fetching top items with params:', params);
      
      const response = await axios.get(`${API_BASE_URL}/traffic/top/${params.category}`, {
        params: {
          timeRange: params.timeRange,
          limit: params.limit || 10
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch top ${params.category}:`, error);
      throw new Error(`En çok kullanılan ${this.getCategoryName(params.category)} alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Bant genişliği kullanım verilerini getirir
   * @param params Sorgu parametreleri
   * @returns Bant genişliği kullanım verileri
   */
  public static async getBandwidthUsage(params: BandwidthUsageParams): Promise<TrafficData[]> {
    try {
      logger.debug('Fetching bandwidth usage with params:', params);
      
      const response = await axios.get<TrafficData[]>(`${API_BASE_URL}/traffic/bandwidth`, {
        params: {
          timeRange: params.timeRange,
          deviceIds: params.deviceIds?.join(','),
          protocols: params.protocols?.join(','),
          aggregation: params.aggregation || this.getDefaultAggregation(params.timeRange)
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch bandwidth usage:', error);
      throw new Error('Bant genişliği kullanım verileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir IP adresi için trafik verilerini getirir
   * @param ip IP adresi
   * @param timeRange Zaman aralığı
   * @returns IP adresi için trafik verileri
   */
  public static async getIpTrafficData(ip: string, timeRange: TimeRange): Promise<any> {
    try {
      logger.debug(`Fetching traffic data for IP ${ip} in time range:`, timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/traffic/ip/${ip}`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch traffic data for IP ${ip}:`, error);
      throw new Error(`${ip} IP adresi için trafik verileri alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Trafik anomali verilerini getirir
   * @param timeRange Zaman aralığı
   * @returns Anomali verileri
   */
  public static async getTrafficAnomalies(timeRange: TimeRange): Promise<any> {
    try {
      logger.debug('Fetching traffic anomalies for time range:', timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/traffic/anomalies`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch traffic anomalies:', error);
      throw new Error('Trafik anomali verileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Trafik akışlarını getirir
   * @param timeRange Zaman aralığı
   * @param limit Maksimum akış sayısı
   * @returns Trafik akışları
   */
  public static async getTrafficFlows(timeRange: TimeRange, limit: number = 100): Promise<any> {
    try {
      logger.debug('Fetching traffic flows for time range:', timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/traffic/flows`, {
        params: { 
          timeRange,
          limit 
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch traffic flows:', error);
      throw new Error('Trafik akışları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Zaman aralığına göre varsayılan veri toplama aralığını belirler
   * @param timeRange Zaman aralığı
   * @returns Veri toplama aralığı
   */
  private static getDefaultAggregation(timeRange: TimeRange): 'minute' | 'hour' | 'day' {
    switch (timeRange) {
      case '15m':
      case '1h':
        return 'minute';
      case '6h':
      case '24h':
        return 'hour';
      case '7d':
      case '30d':
        return 'day';
      default:
        return 'hour';
    }
  }
  
  /**
   * Kategori tipinden kategori adını verir
   * @param category Kategori tipi
   * @returns Kategori adı
   */
  private static getCategoryName(category: string): string {
    switch (category) {
      case 'protocols':
        return 'protokoller';
      case 'sources':
        return 'kaynak IP\'ler';
      case 'destinations':
        return 'hedef IP\'ler';
      case 'applications':
        return 'uygulamalar';
      default:
        return category;
    }
  }
}

export { TrafficAnalysisService };
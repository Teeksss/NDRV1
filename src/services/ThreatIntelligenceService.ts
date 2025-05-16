import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { ThreatIndicator, ThreatFeed, ThreatAnalysis, ThreatCategory } from '@/models/ThreatIntelligence';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface ThreatIntelligenceParams {
  timeRange?: TimeRange;
  categories?: ThreatCategory[];
  confidenceMin?: number;
  sources?: string[];
  limit?: number;
  includeExpired?: boolean;
}

interface IpLookupOptions {
  includeLowConfidence?: boolean;
  includeHistorical?: boolean;
  sources?: string[];
}

/**
 * Tehdit istihbaratı için servis sınıfı
 * Bu servis, tehdit istihbaratı verilerini yönetir ve sorgular
 */
class ThreatIntelligenceService {
  /**
   * Aktif tehdit göstergelerini getirir
   * @param params Sorgu parametreleri
   * @returns Tehdit göstergeleri
   */
  public static async getThreatIndicators(params: ThreatIntelligenceParams = {}): Promise<ThreatIndicator[]> {
    try {
      logger.debug('Fetching threat indicators with params:', params);
      
      const response = await axios.get<ThreatIndicator[]>(`${API_BASE_URL}/threat-intelligence/indicators`, {
        params: {
          timeRange: params.timeRange,
          categories: params.categories?.join(','),
          confidenceMin: params.confidenceMin,
          sources: params.sources?.join(','),
          limit: params.limit || 100,
          includeExpired: params.includeExpired
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat indicators:', error);
      throw new Error('Tehdit göstergeleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tehdit beslemelerini (feed) getirir
   * @returns Tehdit beslemeleri
   */
  public static async getThreatFeeds(): Promise<ThreatFeed[]> {
    try {
      logger.debug('Fetching threat feeds');
      
      const response = await axios.get<ThreatFeed[]>(`${API_BASE_URL}/threat-intelligence/feeds`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat feeds:', error);
      throw new Error('Tehdit beslemeleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * IP adresi için tehdit bilgilerini sorgular
   * @param ip IP adresi
   * @param options Sorgu seçenekleri
   * @returns IP adresi için tehdit analizi
   */
  public static async lookupIp(ip: string, options: IpLookupOptions = {}): Promise<ThreatAnalysis> {
    try {
      logger.debug(`Looking up threat data for IP ${ip} with options:`, options);
      
      const response = await axios.get<ThreatAnalysis>(`${API_BASE_URL}/threat-intelligence/lookup/ip/${ip}`, {
        params: {
          includeLowConfidence: options.includeLowConfidence,
          includeHistorical: options.includeHistorical,
          sources: options.sources?.join(',')
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to lookup threat data for IP ${ip}:`, error);
      throw new Error(`${ip} IP adresi için tehdit verileri alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Domain için tehdit bilgilerini sorgular
   * @param domain Domain adı
   * @param options Sorgu seçenekleri
   * @returns Domain için tehdit analizi
   */
  public static async lookupDomain(domain: string, options: IpLookupOptions = {}): Promise<ThreatAnalysis> {
    try {
      logger.debug(`Looking up threat data for domain ${domain}`);
      
      const response = await axios.get<ThreatAnalysis>(`${API_BASE_URL}/threat-intelligence/lookup/domain/${domain}`, {
        params: {
          includeLowConfidence: options.includeLowConfidence,
          includeHistorical: options.includeHistorical,
          sources: options.sources?.join(',')
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to lookup threat data for domain ${domain}:`, error);
      throw new Error(`${domain} domaini için tehdit verileri alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Hash değeri için tehdit bilgilerini sorgular
   * @param hash Hash değeri (MD5, SHA1, SHA256)
   * @returns Hash için tehdit analizi
   */
  public static async lookupHash(hash: string): Promise<ThreatAnalysis> {
    try {
      logger.debug(`Looking up threat data for hash ${hash}`);
      
      const response = await axios.get<ThreatAnalysis>(`${API_BASE_URL}/threat-intelligence/lookup/hash/${hash}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to lookup threat data for hash ${hash}:`, error);
      throw new Error(`${hash} hash değeri için tehdit verileri alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Tehdit istihbaratı kaynaklarının durumunu getirir
   * @returns Kaynakların durumu
   */
  public static async getSourceStatus(): Promise<any> {
    try {
      logger.debug('Fetching threat intelligence source status');
      
      const response = await axios.get(`${API_BASE_URL}/threat-intelligence/sources/status`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat intelligence source status:', error);
      throw new Error('Tehdit istihbaratı kaynaklarının durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tehdit kategorilerini getirir
   * @returns Tehdit kategorileri
   */
  public static async getThreatCategories(): Promise<Record<ThreatCategory, string>> {
    try {
      logger.debug('Fetching threat categories');
      
      const response = await axios.get<Record<ThreatCategory, string>>(`${API_BASE_URL}/threat-intelligence/categories`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat categories:', error);
      throw new Error('Tehdit kategorileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tehdit istihbaratı istatistiklerini getirir
   * @param timeRange Zaman aralığı
   * @returns İstatistikler
   */
  public static async getStatistics(timeRange: TimeRange): Promise<any> {
    try {
      logger.debug('Fetching threat intelligence statistics for time range:', timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/threat-intelligence/statistics`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat intelligence statistics:', error);
      throw new Error('Tehdit istihbaratı istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Özel tehdit göstergesi ekler
   * @param indicator Tehdit göstergesi
   * @returns Eklenen gösterge
   */
  public static async addCustomIndicator(indicator: Partial<ThreatIndicator>): Promise<ThreatIndicator> {
    try {
      logger.debug('Adding custom threat indicator:', indicator);
      
      const response = await axios.post<ThreatIndicator>(`${API_BASE_URL}/threat-intelligence/indicators/custom`, indicator);
      return response.data;
    } catch (error) {
      logger.error('Failed to add custom threat indicator:', error);
      throw new Error('Özel tehdit göstergesi eklenemedi. Lütfen tekrar deneyin.');
    }
  }
}

export { ThreatIntelligenceService };
import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

/**
 * NDR bileşenlerini entegre eden servis
 * Bu servis, Zeek, Suricata, Arkime, Elastic gibi NDR bileşenleri ile iletişim kurar
 */
class NDRIntegrationService {
  /**
   * Zeek tarafından tespit edilen olayları getirir
   * @param timeRange Zaman aralığı
   * @param limit Maksimum olay sayısı
   * @returns Zeek olayları
   */
  public static async getZeekEvents(timeRange: TimeRange, limit: number = 100): Promise<any[]> {
    try {
      logger.debug(`Fetching Zeek events for time range: ${timeRange}, limit: ${limit}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/zeek/events`, {
        params: { 
          timeRange,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Zeek events:', error);
      throw new Error('Zeek olayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Suricata tarafından tespit edilen uyarıları getirir
   * @param timeRange Zaman aralığı
   * @param severity Minimum önem derecesi
   * @param limit Maksimum uyarı sayısı
   * @returns Suricata uyarıları
   */
  public static async getSuricataAlerts(
    timeRange: TimeRange, 
    severity?: number,
    limit: number = 100
  ): Promise<any[]> {
    try {
      logger.debug(`Fetching Suricata alerts for time range: ${timeRange}, severity: ${severity}, limit: ${limit}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/suricata/alerts`, {
        params: { 
          timeRange,
          severity,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Suricata alerts:', error);
      throw new Error('Suricata uyarıları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Arkime oturumlarını getirir
   * @param timeRange Zaman aralığı
   * @param query Arama sorgusu
   * @param limit Maksimum oturum sayısı
   * @returns Arkime oturumları
   */
  public static async getArkimeSessions(
    timeRange: TimeRange,
    query?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      logger.debug(`Fetching Arkime sessions for time range: ${timeRange}, query: ${query}, limit: ${limit}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/arkime/sessions`, {
        params: {
          timeRange,
          query,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Arkime sessions:', error);
      throw new Error('Arkime oturumları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * PCAP dosyasını indirir
   * @param sessionId Oturum ID
   * @returns PCAP dosya içeriği
   */
  public static async downloadPcap(sessionId: string): Promise<Blob> {
    try {
      logger.debug(`Downloading PCAP for session: ${sessionId}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/arkime/sessions/${sessionId}/pcap`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to download PCAP for session ${sessionId}:`, error);
      throw new Error('PCAP dosyası indirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Elasticsearch'den NDR olaylarını getirir
   * @param index Elasticsearch indeks adı
   * @param query Elasticsearch sorgusu
   * @param timeRange Zaman aralığı
   * @param limit Maksimum sonuç sayısı
   * @returns Elasticsearch sonuçları
   */
  public static async getElasticsearchEvents(
    index: string,
    query: any,
    timeRange: TimeRange,
    limit: number = 100
  ): Promise<any> {
    try {
      logger.debug(`Fetching Elasticsearch events for index: ${index}, timeRange: ${timeRange}, limit: ${limit}`);
      
      const response = await axios.post(`${API_BASE_URL}/ndr/elasticsearch/search`, {
        index,
        query,
        timeRange,
        limit
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Elasticsearch events:', error);
      throw new Error('Elasticsearch olayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * NDR servislerinin durumunu getirir
   * @returns Servis durumları
   */
  public static async getServiceStatus(): Promise<any> {
    try {
      logger.debug('Fetching NDR service status');
      
      const response = await axios.get(`${API_BASE_URL}/ndr/status`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch NDR service status:', error);
      throw new Error('NDR servisleri durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Güncel NDR tehdit istihbaratı istatistiklerini getirir
   * @returns Tehdit istihbaratı istatistikleri
   */
  public static async getThreatIntelStats(): Promise<any> {
    try {
      logger.debug('Fetching threat intelligence stats');
      
      const response = await axios.get(`${API_BASE_URL}/ndr/threat-intel/stats`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch threat intelligence stats:', error);
      throw new Error('Tehdit istihbaratı istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir protokol için Zeek loglarını getirir
   * @param protocol Protokol adı (conn, dns, http, ssl, vb.)
   * @param timeRange Zaman aralığı
   * @param filters Filtre kriterleri
   * @param limit Maksimum sonuç sayısı
   * @returns Zeek logları
   */
  public static async getZeekLogs(
    protocol: string,
    timeRange: TimeRange,
    filters?: Record<string, any>,
    limit: number = 100
  ): Promise<any[]> {
    try {
      logger.debug(`Fetching Zeek ${protocol} logs for time range: ${timeRange}, limit: ${limit}`);
      
      const response = await axios.post(`${API_BASE_URL}/ndr/zeek/logs/${protocol}`, {
        timeRange,
        filters,
        limit
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Zeek ${protocol} logs:`, error);
      throw new Error(`Zeek ${protocol} logları alınamadı. Lütfen tekrar deneyin.`);
    }
  }
  
  /**
   * Prometheus metriklerini getirir
   * @param query Prometheus sorgusu
   * @param timeRange Zaman aralığı
   * @returns Prometheus metrikleri
   */
  public static async getPrometheusMetrics(query: string, timeRange: TimeRange): Promise<any> {
    try {
      logger.debug(`Fetching Prometheus metrics for query: ${query}, timeRange: ${timeRange}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/prometheus/query`, {
        params: {
          query,
          timeRange
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Prometheus metrics:', error);
      throw new Error('Prometheus metrikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Olaylardaki IP adresleri için Whois bilgilerini getirir
   * @param ip IP adresi
   * @returns Whois bilgileri
   */
  public static async getWhoisInfo(ip: string): Promise<any> {
    try {
      logger.debug(`Fetching Whois info for IP: ${ip}`);
      
      const response = await axios.get(`${API_BASE_URL}/ndr/whois/${ip}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Whois info for IP ${ip}:`, error);
      throw new Error('Whois bilgileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { NDRIntegrationService };
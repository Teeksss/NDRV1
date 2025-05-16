import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface MetricThreshold {
  id: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'outside';
  value: number | [number, number];
  duration: number; // ms
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  description: string;
  actionId?: string;
}

interface HealthCheckConfig {
  id: string;
  name: string;
  description: string;
  type: 'ping' | 'tcp' | 'http' | 'https' | 'dns' | 'tls';
  target: string;
  port?: number;
  path?: string;
  expectedStatus?: number;
  expectedContent?: string;
  headers?: Record<string, string>;
  intervalSeconds: number;
  timeoutSeconds: number;
  enabled: boolean;
  alertOnFailure: boolean;
  failureThreshold: number;
  tags: string[];
}

interface HealthCheckResult {
  id: string;
  checkId: string;
  timestamp: string;
  status: 'success' | 'failed' | 'timeout';
  responseTime: number;
  errorMessage?: string;
  details?: any;
}

interface TopologyNode {
  id: string;
  name: string;
  type: string;
  ip: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  interfaces: {
    name: string;
    ip: string;
    mac: string;
    speed: number;
    status: 'up' | 'down';
  }[];
  metrics: Record<string, number>;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface TopologyLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  bandwidth: number;
  utilization: number;
  latency: number;
  status: 'up' | 'down' | 'degraded';
}

/**
 * Ağ izleme ve performans ölçümleri için servis sınıfı
 * Bu servis, ağın canlılığını, performansını ve ağ topolojisini izler
 */
class NetworkMonitoringService {
  /**
   * Metrik eşiklerini (thresholds) getirir
   * @returns Eşikler listesi
   */
  public static async getMetricThresholds(): Promise<MetricThreshold[]> {
    try {
      logger.debug('Fetching metric thresholds');
      
      const response = await axios.get<MetricThreshold[]>(`${API_BASE_URL}/monitoring/thresholds`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch metric thresholds:', error);
      throw new Error('Metrik eşikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir metrik eşiği oluşturur
   * @param threshold Eşik bilgisi
   * @returns Oluşturulan eşik
   */
  public static async createMetricThreshold(threshold: Partial<MetricThreshold>): Promise<MetricThreshold> {
    try {
      logger.debug('Creating new metric threshold');
      
      const response = await axios.post<MetricThreshold>(`${API_BASE_URL}/monitoring/thresholds`, threshold);
      return response.data;
    } catch (error) {
      logger.error('Failed to create metric threshold:', error);
      throw new Error('Metrik eşiği oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir metrik eşiğini günceller
   * @param thresholdId Eşik ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş eşik
   */
  public static async updateMetricThreshold(thresholdId: string, updates: Partial<MetricThreshold>): Promise<MetricThreshold> {
    try {
      logger.debug(`Updating metric threshold ${thresholdId}`);
      
      const response = await axios.put<MetricThreshold>(`${API_BASE_URL}/monitoring/thresholds/${thresholdId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update metric threshold ${thresholdId}:`, error);
      throw new Error('Metrik eşiği güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir metrik eşiğini siler
   * @param thresholdId Eşik ID
   * @returns Silme durumu
   */
  public static async deleteMetricThreshold(thresholdId: string): Promise<any> {
    try {
      logger.debug(`Deleting metric threshold ${thresholdId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/monitoring/thresholds/${thresholdId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete metric threshold ${thresholdId}:`, error);
      throw new Error('Metrik eşiği silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Sağlık kontrol konfigürasyonlarını getirir
   * @returns Sağlık kontrol konfigürasyonları
   */
  public static async getHealthChecks(): Promise<HealthCheckConfig[]> {
    try {
      logger.debug('Fetching health checks');
      
      const response = await axios.get<HealthCheckConfig[]>(`${API_BASE_URL}/monitoring/health-checks`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch health checks:', error);
      throw new Error('Sağlık kontrolleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir sağlık kontrolü oluşturur
   * @param healthCheck Sağlık kontrolü bilgisi
   * @returns Oluşturulan sağlık kontrolü
   */
  public static async createHealthCheck(healthCheck: Partial<HealthCheckConfig>): Promise<HealthCheckConfig> {
    try {
      logger.debug('Creating new health check');
      
      const response = await axios.post<HealthCheckConfig>(`${API_BASE_URL}/monitoring/health-checks`, healthCheck);
      return response.data;
    } catch (error) {
      logger.error('Failed to create health check:', error);
      throw new Error('Sağlık kontrolü oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir sağlık kontrolünü günceller
   * @param checkId Kontrol ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş sağlık kontrolü
   */
  public static async updateHealthCheck(checkId: string, updates: Partial<HealthCheckConfig>): Promise<HealthCheckConfig> {
    try {
      logger.debug(`Updating health check ${checkId}`);
      
      const response = await axios.put<HealthCheckConfig>(`${API_BASE_URL}/monitoring/health-checks/${checkId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update health check ${checkId}:`, error);
      throw new Error('Sağlık kontrolü güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir sağlık kontrolünü siler
   * @param checkId Kontrol ID
   * @returns Silme durumu
   */
  public static async deleteHealthCheck(checkId: string): Promise<any> {
    try {
      logger.debug(`Deleting health check ${checkId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/monitoring/health-checks/${checkId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete health check ${checkId}:`, error);
      throw new Error('Sağlık kontrolü silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Sağlık kontrolü sonuçlarını getirir
   * @param checkId Kontrol ID (opsiyonel, belirtilmezse tüm kontroller için)
   * @param timeRange Zaman aralığı
   * @param limit Maksimum sonuç sayısı
   * @returns Sağlık kontrolü sonuçları
   */
  public static async getHealthCheckResults(checkId?: string, timeRange?: TimeRange, limit: number = 100): Promise<HealthCheckResult[]> {
    try {
      logger.debug(`Fetching health check results for check ${checkId || 'all'}`);
      
      const endpoint = checkId 
        ? `${API_BASE_URL}/monitoring/health-checks/${checkId}/results` 
        : `${API_BASE_URL}/monitoring/health-checks/results`;
      
      const response = await axios.get<HealthCheckResult[]>(endpoint, {
        params: {
          timeRange,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch health check results for check ${checkId || 'all'}:`, error);
      throw new Error('Sağlık kontrolü sonuçları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Manuel olarak bir sağlık kontrolü çalıştırır
   * @param checkId Kontrol ID
   * @returns Sağlık kontrolü sonucu
   */
  public static async runHealthCheck(checkId: string): Promise<HealthCheckResult> {
    try {
      logger.debug(`Running health check ${checkId} manually`);
      
      const response = await axios.post<HealthCheckResult>(`${API_BASE_URL}/monitoring/health-checks/${checkId}/run`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to run health check ${checkId}:`, error);
      throw new Error('Sağlık kontrolü çalıştırılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağ topolojisi bilgisini getirir
   * @returns Ağ topolojisi
   */
  public static async getNetworkTopology(): Promise<{ nodes: TopologyNode[]; links: TopologyLink[] }> {
    try {
      logger.debug('Fetching network topology');
      
      const response = await axios.get<{ nodes: TopologyNode[]; links: TopologyLink[] }>(`${API_BASE_URL}/monitoring/topology`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network topology:', error);
      throw new Error('Ağ topolojisi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir zaman aralığı için ağ performans metriklerini getirir
   * @param metricName Metrik adı
   * @param timeRange Zaman aralığı
   * @param deviceId Cihaz ID (opsiyonel)
   * @returns Performans metrikleri
   */
  public static async getPerformanceMetrics(metricName: string, timeRange: TimeRange, deviceId?: string): Promise<any> {
    try {
      logger.debug(`Fetching performance metrics ${metricName} for time range ${timeRange}`);
      
      const response = await axios.get(`${API_BASE_URL}/monitoring/metrics/${metricName}`, {
        params: {
          timeRange,
          deviceId
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch performance metrics ${metricName}:`, error);
      throw new Error('Performans metrikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağ performans özet bilgilerini getirir
   * @returns Performans özeti
   */
  public static async getPerformanceSummary(): Promise<any> {
    try {
      logger.debug('Fetching performance summary');
      
      const response = await axios.get(`${API_BASE_URL}/monitoring/performance-summary`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch performance summary:', error);
      throw new Error('Performans özeti alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Ağ bağlantı sorunlarını getirir
   * @param timeRange Zaman aralığı
   * @param severity Minimum önem seviyesi
   * @returns Bağlantı sorunları
   */
  public static async getConnectivityIssues(timeRange: TimeRange, severity?: 'critical' | 'high' | 'medium' | 'low'): Promise<any> {
    try {
      logger.debug(`Fetching connectivity issues for time range ${timeRange}`);
      
      const response = await axios.get(`${API_BASE_URL}/monitoring/connectivity-issues`, {
        params: {
          timeRange,
          severity
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch connectivity issues:', error);
      throw new Error('Bağlantı sorunları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Hostlar arasında ağ yolu teşhisi (traceroute benzeri)
   * @param sourceIp Kaynak IP
   * @param targetIp Hedef IP
   * @returns Ağ yolu bilgisi
   */
  public static async traceRoute(sourceIp: string, targetIp: string): Promise<any> {
    try {
      logger.debug(`Tracing route from ${sourceIp} to ${targetIp}`);
      
      const response = await axios.post(`${API_BASE_URL}/monitoring/trace-route`, {
        sourceIp,
        targetIp
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to trace route from ${sourceIp} to ${targetIp}:`, error);
      throw new Error('Ağ yolu teşhisi yapılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Hostlar arasında bant genişliği testi
   * @param sourceIp Kaynak IP
   * @param targetIp Hedef IP
   * @param durationSeconds Test süresi (saniye)
   * @returns Bant genişliği test sonuçları
   */
  public static async bandwidthTest(sourceIp: string, targetIp: string, durationSeconds: number = 10): Promise<any> {
    try {
      logger.debug(`Running bandwidth test from ${sourceIp} to ${targetIp} for ${durationSeconds} seconds`);
      
      const response = await axios.post(`${API_BASE_URL}/monitoring/bandwidth-test`, {
        sourceIp,
        targetIp,
        durationSeconds
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to run bandwidth test from ${sourceIp} to ${targetIp}:`, error);
      throw new Error('Bant genişliği testi yapılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm izleme hizmetlerinin sağlık durumunu getirir
   * @returns Sağlık durumu
   */
  public static async getMonitoringHealth(): Promise<any> {
    try {
      logger.debug('Fetching monitoring health status');
      
      const response = await axios.get(`${API_BASE_URL}/monitoring/health`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch monitoring health status:', error);
      throw new Error('İzleme hizmetleri sağlık durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export {
  NetworkMonitoringService,
  MetricThreshold,
  HealthCheckConfig,
  HealthCheckResult,
  TopologyNode,
  TopologyLink
};
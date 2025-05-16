import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { Device, DeviceInterface, DeviceGroup, DeviceStatus } from '@/models/Device';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface DeviceListParams {
  search?: string;
  types?: string[];
  statuses?: DeviceStatus[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface DeviceMetricsParams {
  deviceId: string;
  metrics: string[];
  timeRange: TimeRange;
  interval?: string;
}

/**
 * Cihaz yönetimi için servis sınıfı
 * Bu servis, cihazların listelenmesi, detayları ve metrikleri ile ilgili işlevler sağlar
 */
class DeviceService {
  /**
   * Cihazları listeler
   * @param params Sorgu parametreleri
   * @returns Cihaz listesi
   */
  public static async getDevices(params: DeviceListParams = {}): Promise<{ devices: Device[], total: number }> {
    try {
      logger.debug('Fetching devices with params:', params);
      
      const response = await axios.get(`${API_BASE_URL}/devices`, {
        params: {
          search: params.search,
          types: params.types?.join(','),
          statuses: params.statuses?.join(','),
          tags: params.tags?.join(','),
          limit: params.limit || 100,
          offset: params.offset || 0,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch devices:', error);
      throw new Error('Cihazlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihazın detaylarını getirir
   * @param deviceId Cihaz ID
   * @returns Cihaz detayları
   */
  public static async getDeviceById(deviceId: string): Promise<Device> {
    try {
      logger.debug(`Fetching device ${deviceId}`);
      
      const response = await axios.get<Device>(`${API_BASE_URL}/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch device ${deviceId}:`, error);
      throw new Error('Cihaz detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihazın arayüzlerini getirir
   * @param deviceId Cihaz ID
   * @returns Cihaz arayüzleri
   */
  public static async getDeviceInterfaces(deviceId: string): Promise<DeviceInterface[]> {
    try {
      logger.debug(`Fetching interfaces for device ${deviceId}`);
      
      const response = await axios.get<DeviceInterface[]>(`${API_BASE_URL}/devices/${deviceId}/interfaces`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch interfaces for device ${deviceId}:`, error);
      throw new Error('Cihaz arayüzleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihazın metriklerini getirir
   * @param params Sorgu parametreleri
   * @returns Cihaz metrikleri
   */
  public static async getDeviceMetrics(params: DeviceMetricsParams): Promise<any> {
    try {
      logger.debug(`Fetching metrics for device ${params.deviceId}:`, params);
      
      const response = await axios.get(`${API_BASE_URL}/devices/${params.deviceId}/metrics`, {
        params: {
          metrics: params.metrics.join(','),
          timeRange: params.timeRange,
          interval: params.interval
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch metrics for device ${params.deviceId}:`, error);
      throw new Error('Cihaz metrikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihaz için uyarıları getirir
   * @param deviceId Cihaz ID
   * @param timeRange Zaman aralığı
   * @returns Uyarı listesi
   */
  public static async getDeviceAlerts(deviceId: string, timeRange: TimeRange): Promise<any> {
    try {
      logger.debug(`Fetching alerts for device ${deviceId} in time range:`, timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/alerts`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch alerts for device ${deviceId}:`, error);
      throw new Error('Cihaz uyarıları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihaz için anomalileri getirir
   * @param deviceId Cihaz ID
   * @param timeRange Zaman aralığı
   * @returns Anomali listesi
   */
  public static async getDeviceAnomalies(deviceId: string, timeRange: TimeRange): Promise<any> {
    try {
      logger.debug(`Fetching anomalies for device ${deviceId} in time range:`, timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/anomalies`, {
        params: { timeRange }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch anomalies for device ${deviceId}:`, error);
      throw new Error('Cihaz anomalileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir cihaz için trafik verilerini getirir
   * @param deviceId Cihaz ID
   * @param timeRange Zaman aralığı
   * @param interfaces Arayüz ID'leri (opsiyonel)
   * @returns Trafik verileri
   */
  public static async getDeviceTraffic(
    deviceId: string, 
    timeRange: TimeRange,
    interfaces?: string[]
  ): Promise<any> {
    try {
      logger.debug(`Fetching traffic for device ${deviceId} in time range:`, timeRange);
      
      const response = await axios.get(`${API_BASE_URL}/devices/${deviceId}/traffic`, {
        params: { 
          timeRange,
          interfaces: interfaces?.join(',')
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch traffic for device ${deviceId}:`, error);
      throw new Error('Cihaz trafik verileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Cihaz gruplarını getirir
   * @returns Cihaz grupları
   */
  public static async getDeviceGroups(): Promise<DeviceGroup[]> {
    try {
      logger.debug('Fetching device groups');
      
      const response = await axios.get<DeviceGroup[]>(`${API_BASE_URL}/devices/groups`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch device groups:', error);
      throw new Error('Cihaz grupları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Cihazları gruplar
   * @param groupId Grup ID
   * @param deviceIds Cihaz ID'leri
   * @returns Güncellenen grup
   */
  public static async assignDevicesToGroup(groupId: string, deviceIds: string[]): Promise<DeviceGroup> {
    try {
      logger.debug(`Assigning devices to group ${groupId}:`, deviceIds);
      
      const response = await axios.post<DeviceGroup>(`${API_BASE_URL}/devices/groups/${groupId}/assign`, {
        deviceIds
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to assign devices to group ${groupId}:`, error);
      throw new Error('Cihazlar gruba atanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Cihazların durumunu özetler
   * @returns Durum özeti
   */
  public static async getDeviceStatusSummary(): Promise<any> {
    try {
      logger.debug('Fetching device
import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { logger } from '@/utils/logger';

interface ConfigCategory {
  id: string;
  name: string;
  description: string;
  order: number;
  icon?: string;
}

interface ConfigItem {
  id: string;
  categoryId: string;
  name: string;
  key: string;
  value: any;
  defaultValue: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'select';
  options?: any[];
  description: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    regex?: string;
    custom?: string;
  };
  sensitive: boolean;
  tags: string[];
  lastModified: string;
  modifiedBy: string;
  requiresRestart: boolean;
}

interface ConfigSnapshot {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
  data: Record<string, any>;
}

/**
 * NDR konfigürasyon yönetimi için servis sınıfı
 * Bu servis, NDR sisteminin tüm yapılandırma ayarlarını yönetir
 */
class NDRConfigurationService {
  /**
   * Tüm konfigürasyon kategorilerini getirir
   * @returns Kategori listesi
   */
  public static async getConfigCategories(): Promise<ConfigCategory[]> {
    try {
      logger.debug('Fetching configuration categories');
      
      const response = await axios.get<ConfigCategory[]>(`${API_BASE_URL}/config/categories`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch configuration categories:', error);
      throw new Error('Yapılandırma kategorileri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir kategorideki konfigürasyon öğelerini getirir
   * @param categoryId Kategori ID
   * @returns Konfigürasyon öğeleri
   */
  public static async getConfigItemsByCategory(categoryId: string): Promise<ConfigItem[]> {
    try {
      logger.debug(`Fetching configuration items for category ${categoryId}`);
      
      const response = await axios.get<ConfigItem[]>(`${API_BASE_URL}/config/categories/${categoryId}/items`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch configuration items for category ${categoryId}:`, error);
      throw new Error('Yapılandırma öğeleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir konfigürasyon öğesinin detaylarını getirir
   * @param itemId Öğe ID
   * @returns Konfigürasyon öğesi
   */
  public static async getConfigItemById(itemId: string): Promise<ConfigItem> {
    try {
      logger.debug(`Fetching configuration item ${itemId}`);
      
      const response = await axios.get<ConfigItem>(`${API_BASE_URL}/config/items/${itemId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch configuration item ${itemId}:`, error);
      throw new Error('Yapılandırma öğesi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir konfigürasyon öğesini günceller
   * @param itemId Öğe ID
   * @param value Yeni değer
   * @returns Güncellenmiş konfigürasyon öğesi
   */
  public static async updateConfigItem(itemId: string, value: any): Promise<ConfigItem> {
    try {
      logger.debug(`Updating configuration item ${itemId}`);
      
      const response = await axios.put<ConfigItem>(`${API_BASE_URL}/config/items/${itemId}`, {
        value
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to update configuration item ${itemId}:`, error);
      throw new Error('Yapılandırma öğesi güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir konfigürasyon öğesini varsayılan değerine sıfırlar
   * @param itemId Öğe ID
   * @returns Sıfırlanmış konfigürasyon öğesi
   */
  public static async resetConfigItem(itemId: string): Promise<ConfigItem> {
    try {
      logger.debug(`Resetting configuration item ${itemId} to default value`);
      
      const response = await axios.post<ConfigItem>(`${API_BASE_URL}/config/items/${itemId}/reset`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to reset configuration item ${itemId}:`, error);
      throw new Error('Yapılandırma öğesi sıfırlanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm konfigürasyonun bir anlık görüntüsünü (snapshot) alır
   * @param name Snapshot adı
   * @param description Açıklama
   * @returns Oluşturulan snapshot
   */
  public static async createConfigSnapshot(name: string, description?: string): Promise<ConfigSnapshot> {
    try {
      logger.debug('Creating configuration snapshot');
      
      const response = await axios.post<ConfigSnapshot>(`${API_BASE_URL}/config/snapshots`, {
        name,
        description
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create configuration snapshot:', error);
      throw new Error('Yapılandırma anlık görüntüsü oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm konfigürasyon snapshotlarını getirir
   * @returns Snapshot listesi
   */
  public static async getConfigSnapshots(): Promise<ConfigSnapshot[]> {
    try {
      logger.debug('Fetching configuration snapshots');
      
      const response = await axios.get<ConfigSnapshot[]>(`${API_BASE_URL}/config/snapshots`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch configuration snapshots:', error);
      throw new Error('Yapılandırma anlık görüntüleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir konfigürasyon snapshotunun detaylarını getirir
   * @param snapshotId Snapshot ID
   * @returns Snapshot detayları
   */
  public static async getConfigSnapshotById(snapshotId: string): Promise<ConfigSnapshot> {
    try {
      logger.debug(`Fetching configuration snapshot ${snapshotId}`);
      
      const response = await axios.get<ConfigSnapshot>(`${API_BASE_URL}/config/snapshots/${snapshotId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch configuration snapshot ${snapshotId}:`, error);
      throw new Error('Yapılandırma anlık görüntüsü alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir konfigürasyon snapshotunu geri yükler
   * @param snapshotId Snapshot ID
   * @returns Geri yükleme durumu
   */
  public static async restoreConfigSnapshot(snapshotId: string): Promise<any> {
    try {
      logger.debug(`Restoring configuration from snapshot ${snapshotId}`);
      
      const response = await axios.post(`${API_BASE_URL}/config/snapshots/${snapshotId}/restore`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to restore configuration from snapshot ${snapshotId}:`, error);
      throw new Error('Yapılandırma anlık görüntüsü geri yüklenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir konfigürasyon snapshotunu siler
   * @param snapshotId Snapshot ID
   * @returns Silme durumu
   */
  public static async deleteConfigSnapshot(snapshotId: string): Promise<any> {
    try {
      logger.debug(`Deleting configuration snapshot ${snapshotId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/config/snapshots/${snapshotId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete configuration snapshot ${snapshotId}:`, error);
      throw new Error('Yapılandırma anlık görüntüsü silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * İki konfigürasyon snapshotu arasındaki farkları getirir
   * @param snapshotId1 İlk snapshot ID
   * @param snapshotId2 İkinci snapshot ID
   * @returns İki snapshot arasındaki farklar
   */
  public static async compareConfigSnapshots(snapshotId1: string, snapshotId2: string): Promise<any> {
    try {
      logger.debug(`Comparing configuration snapshots ${snapshotId1} and ${snapshotId2}`);
      
      const response = await axios.get(`${API_BASE_URL}/config/snapshots/compare`, {
        params: {
          snapshot1: snapshotId1,
          snapshot2: snapshotId2
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to compare configuration snapshots ${snapshotId1} and ${snapshotId2}:`, error);
      throw new Error('Yapılandırma anlık görüntüleri karşılaştırılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Konfigürasyon değişiklik geçmişini getirir
   * @param limit Maksimum kayıt sayısı
   * @returns Değişiklik geçmişi
   */
  public static async getConfigChangeHistory(limit: number = 100): Promise<any[]> {
    try {
      logger.debug(`Fetching configuration change history with limit ${limit}`);
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/config/history`, {
        params: { limit }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch configuration change history:', error);
      throw new Error('Yapılandırma değişiklik geçmişi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Konfigürasyonu export eder
   * @param format Export formatı
   * @returns Exportlanmış konfigürasyon
   */
  public static async exportConfig(format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    try {
      logger.debug(`Exporting configuration in ${format} format`);
      
      const response = await axios.get(`${API_BASE_URL}/config/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to export configuration:', error);
      throw new Error('Yapılandırma export edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Konfigürasyonu import eder
   * @param file Import edilecek dosya
   * @returns Import durumu
   */
  public static async importConfig(file: File): Promise<any> {
    try {
      logger.debug('Importing configuration');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/config/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to import configuration:', error);
      throw new Error('Yapılandırma import edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Sistemin yeniden başlatılmasını gerektirecek tüm yapılandırma değişikliklerini uygular
   * @returns Uygulama durumu
   */
  public static async applyPendingChanges(): Promise<any> {
    try {
      logger.debug('Applying pending configuration changes');
      
      const response = await axios.post(`${API_BASE_URL}/config/apply`);
      return response.data;
    } catch (error) {
      logger.error('Failed to apply pending configuration changes:', error);
      throw new Error('Bekleyen yapılandırma değişiklikleri uygulanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Sistemin yeniden başlatılmasını gerektirecek bekleyen değişiklikler olup olmadığını kontrol eder
   * @returns Bekleyen değişiklikler
   */
  public static async getPendingChanges(): Promise<any> {
    try {
      logger.debug('Checking for pending configuration changes');
      
      const response = await axios.get(`${API_BASE_URL}/config/pending-changes`);
      return response.data;
    } catch (error) {
      logger.error('Failed to check for pending configuration changes:', error);
      throw new Error('Bekleyen yapılandırma değişiklikleri kontrol edilemedi. Lütfen tekrar deneyin.');
    }
  }
}

export { 
  NDRConfigurationService,
  ConfigCategory,
  ConfigItem,
  ConfigSnapshot
};
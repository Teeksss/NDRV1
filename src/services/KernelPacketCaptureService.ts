import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { logger } from '@/utils/logger';

interface CaptureFilter {
  protocol?: string;
  srcIp?: string;
  dstIp?: string;
  srcPort?: number;
  dstPort?: number;
  expression?: string;
}

interface CaptureOptions {
  interface: string;
  snaplen?: number;
  promiscuous?: boolean;
  bufferSize?: number;
  timeout?: number;
  filter?: CaptureFilter;
  maxPackets?: number;
  maxFileSize?: number; // In MB
  splitFileSize?: number; // In MB
  rotate?: boolean;
  rotateCount?: number;
  includeHeaders?: boolean;
  format?: 'pcap' | 'pcapng';
}

interface CaptureSession {
  id: string;
  name: string;
  description?: string;
  options: CaptureOptions;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'stopped' | 'failed';
  fileSize: number;
  packetCount: number;
  error?: string;
  files: {
    name: string;
    size: number;
    path: string;
    createdAt: string;
  }[];
  createdBy: string;
}

/**
 * Kernel düzeyinde paket yakalama için servis sınıfı
 * Bu servis, düşük seviyeli network paketi yakalama ve analiz işlevleri sağlar
 */
class KernelPacketCaptureService {
  /**
   * Mevcut ağ arayüzlerini getirir
   * @returns Arayüz listesi
   */
  public static async getNetworkInterfaces(): Promise<string[]> {
    try {
      logger.debug('Fetching network interfaces');
      
      const response = await axios.get<string[]>(`${API_BASE_URL}/packet-capture/interfaces`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network interfaces:', error);
      throw new Error('Ağ arayüzleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Paket yakalama oturumu başlatır
   * @param options Yakalama seçenekleri
   * @returns Başlatılan oturum
   */
  public static async startCapture(options: CaptureOptions & { name: string; description?: string }): Promise<CaptureSession> {
    try {
      logger.debug(`Starting packet capture on interface ${options.interface}`);
      
      const response = await axios.post<CaptureSession>(`${API_BASE_URL}/packet-capture/sessions`, options);
      return response.data;
    } catch (error) {
      logger.error(`Failed to start packet capture on interface ${options.interface}:`, error);
      throw new Error('Paket yakalama başlatılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Paket yakalama oturumunu durdurur
   * @param sessionId Oturum ID
   * @returns Durdurulan oturum
   */
  public static async stopCapture(sessionId: string): Promise<CaptureSession> {
    try {
      logger.debug(`Stopping packet capture session ${sessionId}`);
      
      const response = await axios.post<CaptureSession>(`${API_BASE_URL}/packet-capture/sessions/${sessionId}/stop`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to stop packet capture session ${sessionId}:`, error);
      throw new Error('Paket yakalama durdurulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm paket yakalama oturumlarını getirir
   * @returns Oturum listesi
   */
  public static async getCaptureSessions(): Promise<CaptureSession[]> {
    try {
      logger.debug('Fetching capture sessions');
      
      const response = await axios.get<CaptureSession[]>(`${API_BASE_URL}/packet-capture/sessions`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch capture sessions:', error);
      throw new Error('Yakalama oturumları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir paket yakalama oturumunun detaylarını getirir
   * @param sessionId Oturum ID
   * @returns Oturum detayları
   */
  public static async getCaptureSessionById(sessionId: string): Promise<CaptureSession> {
    try {
      logger.debug(`Fetching capture session ${sessionId}`);
      
      const response = await axios.get<CaptureSession>(`${API_BASE_URL}/packet-capture/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch capture session ${sessionId}:`, error);
      throw new Error('Yakalama oturumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yakalanan paket dosyasını indirir
   * @param sessionId Oturum ID
   * @param fileIndex Dosya indeksi
   * @returns Paket dosyası
   */
  public static async downloadCaptureFile(sessionId: string, fileIndex: number = 0): Promise<Blob> {
    try {
      logger.debug(`Downloading capture file for session ${sessionId}, file index ${fileIndex}`);
      
      const response = await axios.get(`${API_BASE_URL}/packet-capture/sessions/${sessionId}/files/${fileIndex}/download`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to download capture file for session ${sessionId}, file index ${fileIndex}:`, error);
      throw new Error('Yakalama dosyası indirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Paket yakalama oturumunu siler
   * @param sessionId Oturum ID
   * @returns Silme durumu
   */
  public static async deleteCaptureSession(sessionId: string): Promise<any> {
    try {
      logger.debug(`Deleting capture session ${sessionId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/packet-capture/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete capture session ${sessionId}:`, error);
      throw new Error('Yakalama oturumu silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yakalanan paketlerin özet analizini getirir
   * @param sessionId Oturum ID
   * @returns Analiz sonuçları
   */
  public static async analyzeCaptureSession(sessionId: string): Promise<any> {
    try {
      logger.debug(`Analyzing capture session ${sessionId}`);
      
      const response = await axios.get(`${API_BASE_URL}/packet-capture/sessions/${sessionId}/analyze`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to analyze capture session ${sessionId}:`, error);
      throw new Error('Yakalama oturumu analiz edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Mevcut yakalama filtreleme kurallarını getirir
   * @returns Filtre kuralları
   */
  public static async getCaptureFilterRules(): Promise<string[]> {
    try {
      logger.debug('Fetching capture filter rules');
      
      const response = await axios.get<string[]>(`${API_BASE_URL}/packet-capture/filter-rules`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch capture filter rules:', error);
      throw new Error('Yakalama filtre kuralları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yakalama filtresi doğrular
   * @param filter Filtre
   * @returns Doğrulama sonucu
   */
  public static async validateCaptureFilter(filter: string): Promise<{ valid: boolean; error?: string }> {
    try {
      logger.debug(`Validating capture filter: ${filter}`);
      
      const response = await axios.post<{ valid: boolean; error?: string }>(`${API_BASE_URL}/packet-capture/validate-filter`, {
        filter
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to validate capture filter: ${filter}`, error);
      throw new Error('Yakalama filtresi doğrulanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yakalama motoru durumunu getirir
   * @returns Motor durumu
   */
  public static async getCaptureEngineStatus(): Promise<any> {
    try {
      logger.debug('Fetching capture engine status');
      
      const response = await axios.get(`${API_BASE_URL}/packet-capture/status`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch capture engine status:', error);
      throw new Error('Yakalama motoru durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * PCAP dosyasını sistem üzerinden yükler
   * @param file PCAP dosyası
   * @returns Yükleme sonucu
   */
  public static async uploadPcapFile(file: File): Promise<any> {
    try {
      logger.debug(`Uploading PCAP file: ${file.name}`);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/packet-capture/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to upload PCAP file: ${file.name}`, error);
      throw new Error('PCAP dosyası yüklenemedi. Lütfen tekrar deneyin.');
    }
  }
}

export {
  KernelPacketCaptureService,
  CaptureFilter,
  CaptureOptions,
  CaptureSession
};
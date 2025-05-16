import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'html' | 'json';
type ReportSchedule = 'daily' | 'weekly' | 'monthly' | 'quarterly';
type ReportType = 
  | 'security_overview' 
  | 'threat_intelligence' 
  | 'traffic_analysis' 
  | 'anomaly_detection'
  | 'alert_summary'
  | 'compliance'
  | 'device_inventory'
  | 'network_topology'
  | 'custom';

interface Report {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  createdAt: string;
  createdBy: string;
  timeRange: TimeRange | { start: string; end: string };
  format: ReportFormat;
  parameters: Record<string, any>;
  size?: number;
  downloadUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  format: ReportFormat[];
  parameters: {
    name: string;
    type: string;
    required: boolean;
    default?: any;
    options?: any[];
  }[];
  preview?: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  templateId: string;
  schedule: ReportSchedule;
  timeRange: TimeRange;
  format: ReportFormat;
  parameters: Record<string, any>;
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * NDR raporlama için servis sınıfı
 * Bu servis, NDR veri ve olaylarının raporlanması için kapsamlı işlevler sağlar
 */
class NDRReportingService {
  /**
   * Tüm raporları getirir
   * @param type Rapor tipi
   * @param limit Maksimum rapor sayısı
   * @returns Rapor listesi
   */
  public static async getReports(type?: ReportType, limit: number = 50): Promise<Report[]> {
    try {
      logger.debug(`Fetching reports with type: ${type}, limit: ${limit}`);
      
      const response = await axios.get<Report[]>(`${API_BASE_URL}/reporting/reports`, {
        params: { 
          type,
          limit 
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch reports:', error);
      throw new Error('Raporlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir raporun detaylarını getirir
   * @param reportId Rapor ID
   * @returns Rapor detayları
   */
  public static async getReportById(reportId: string): Promise<Report> {
    try {
      logger.debug(`Fetching report ${reportId}`);
      
      const response = await axios.get<Report>(`${API_BASE_URL}/reporting/reports/${reportId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch report ${reportId}:`, error);
      throw new Error('Rapor detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir rapor oluşturur
   * @param templateId Şablon ID
   * @param params Rapor parametreleri
   * @returns Oluşturulan rapor
   */
  public static async generateReport(templateId: string, params: {
    name: string;
    description?: string;
    timeRange: TimeRange | { start: string; end: string };
    format: ReportFormat;
    parameters: Record<string, any>;
  }): Promise<Report> {
    try {
      logger.debug(`Generating report with template ${templateId}`);
      
      const response = await axios.post<Report>(`${API_BASE_URL}/reporting/reports/generate/${templateId}`, params);
      return response.data;
    } catch (error) {
      logger.error(`Failed to generate report with template ${templateId}:`, error);
      throw new Error('Rapor oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir raporu indirir
   * @param reportId Rapor ID
   * @returns Rapor dosyası
   */
  public static async downloadReport(reportId: string): Promise<Blob> {
    try {
      logger.debug(`Downloading report ${reportId}`);
      
      const response = await axios.get(`${API_BASE_URL}/reporting/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to download report ${reportId}:`, error);
      throw new Error('Rapor indirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir raporu siler
   * @param reportId Rapor ID
   * @returns Silme durumu
   */
  public static async deleteReport(reportId: string): Promise<any> {
    try {
      logger.debug(`Deleting report ${reportId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/reporting/reports/${reportId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete report ${reportId}:`, error);
      throw new Error('Rapor silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Rapor şablonlarını getirir
   * @param type Şablon tipi
   * @returns Şablon listesi
   */
  public static async getReportTemplates(type?: ReportType): Promise<ReportTemplate[]> {
    try {
      logger.debug(`Fetching report templates with type: ${type}`);
      
      const response = await axios.get<ReportTemplate[]>(`${API_BASE_URL}/reporting/templates`, {
        params: { type }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch report templates:', error);
      throw new Error('Rapor şablonları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir rapor şablonunun detaylarını getirir
   * @param templateId Şablon ID
   * @returns Şablon detayları
   */
  public static async getReportTemplateById(templateId: string): Promise<ReportTemplate> {
    try {
      logger.debug(`Fetching report template ${templateId}`);
      
      const response = await axios.get<ReportTemplate>(`${API_BASE_URL}/reporting/templates/${templateId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch report template ${templateId}:`, error);
      throw new Error('Rapor şablonu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir rapor şablonu oluşturur
   * @param template Şablon bilgileri
   * @returns Oluşturulan şablon
   */
  public static async createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      logger.debug('Creating new report template');
      
      const response = await axios.post<ReportTemplate>(`${API_BASE_URL}/reporting/templates`, template);
      return response.data;
    } catch (error) {
      logger.error('Failed to create report template:', error);
      throw new Error('Rapor şablonu oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir rapor şablonunu günceller
   * @param templateId Şablon ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş şablon
   */
  public static async updateReportTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    try {
      logger.debug(`Updating report template ${templateId}`);
      
      const response = await axios.put<ReportTemplate>(`${API_BASE_URL}/reporting/templates/${templateId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update report template ${templateId}:`, error);
      throw new Error('Rapor şablonu güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir rapor şablonunu siler
   * @param templateId Şablon ID
   * @returns Silme durumu
   */
  public static async deleteReportTemplate(templateId: string): Promise<any> {
    try {
      logger.debug(`Deleting report template ${templateId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/reporting/templates/${templateId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete report template ${templateId}:`, error);
      throw new Error('Rapor şablonu silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Zamanlanmış raporları getirir
   * @returns Zamanlanmış rapor listesi
   */
  public static async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      logger.debug('Fetching scheduled reports');
      
      const response = await axios.get<ScheduledReport[]>(`${API_BASE_URL}/reporting/scheduled`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch scheduled reports:', error);
      throw new Error('Zamanlanmış raporlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir zamanlanmış rapor oluşturur
   * @param scheduledReport Zamanlanmış rapor bilgileri
   * @returns Oluşturulan zamanlanmış rapor
   */
  public static async createScheduledReport(scheduledReport: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      logger.debug('Creating new scheduled report');
      
      const response = await axios.post<ScheduledReport>(`${API_BASE_URL}/reporting/scheduled`, scheduledReport);
      return response.data;
    } catch (error) {
      logger.error('Failed to create scheduled report:', error);
      throw new Error('Zamanlanmış rapor oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir zamanlanmış raporu günceller
   * @param scheduledReportId Zamanlanmış rapor ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş zamanlanmış rapor
   */
  public static async updateScheduledReport(scheduledReportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    try {
      logger.debug(`Updating scheduled report ${scheduledReportId}`);
      
      const response = await axios.put<ScheduledReport>(`${API_BASE_URL}/reporting/scheduled/${scheduledReportId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update scheduled report ${scheduledReportId}:`, error);
      throw new Error('Zamanlanmış rapor güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir zamanlanmış raporu siler
   * @param scheduledReportId Zamanlanmış rapor ID
   * @returns Silme durumu
   */
  public static async deleteScheduledReport(scheduledReportId: string): Promise<any> {
    try {
      logger.debug(`Deleting scheduled report ${scheduledReportId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/reporting/scheduled/${scheduledReportId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete scheduled report ${scheduledReportId}:`, error);
      throw new Error('Zamanlanmış rapor silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir zamanlanmış raporu etkinleştirir veya devre dışı bırakır
   * @param scheduledReportId Zamanlanmış rapor ID
   * @param enabled Etkinleştirme durumu
   * @returns Güncellenmiş zamanlanmış rapor
   */
  public static async toggleScheduledReport(scheduledReportId: string, enabled: boolean): Promise<ScheduledReport> {
    try {
      logger.debug(`Toggling scheduled report ${scheduledReportId} to ${enabled ? 'enabled' : 'disabled'}`);
      
      const response = await axios.patch<ScheduledReport>(`${API_BASE_URL}/reporting/scheduled/${scheduledReportId}/toggle`, {
        enabled
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to toggle scheduled report ${scheduledReportId}:`, error);
      throw new Error('Zamanlanmış rapor durumu değiştirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir zamanlanmış raporu hemen çalıştırır
   * @param scheduledReportId Zamanlanmış rapor ID
   * @returns Oluşturulan rapor
   */
  public static async runScheduledReportNow(scheduledReportId: string): Promise<Report> {
    try {
      logger.debug(`Running scheduled report ${scheduledReportId} now`);
      
      const response = await axios.post<Report>(`${API_BASE_URL}/reporting/scheduled/${scheduledReportId}/run`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to run scheduled report ${scheduledReportId} now:`, error);
      throw new Error('Zamanlanmış rapor şimdi çalıştırılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Rapor istatistiklerini getirir
   * @returns Rapor istatistikleri
   */
  public static async getReportingStats(): Promise<any> {
    try {
      logger.debug('Fetching reporting stats');
      
      const response = await axios.get(`${API_BASE_URL}/reporting/stats`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch reporting stats:', error);
      throw new Error('Raporlama istatistikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { 
  NDRReportingService,
  Report,
  ReportTemplate,
  ScheduledReport,
  ReportFormat,
  ReportSchedule,
  ReportType
};
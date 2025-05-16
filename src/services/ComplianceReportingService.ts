import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

type ComplianceFramework = 
  | 'iso27001'
  | 'pcidss'
  | 'hipaa'
  | 'gdpr'
  | 'nist'
  | 'soc2'
  | 'fedramp'
  | 'custom';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable' | 'unknown';

interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  code: string;
  name: string;
  description: string;
  status: ComplianceStatus;
  lastAssessed: string;
  evidenceSources: string[];
  dependencies?: string[];
  remediationSteps?: string[];
  assignedTo?: string;
  dueDate?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  tags: string[];
}

interface ComplianceFrameworkDetails {
  id: string;
  name: string;
  code: ComplianceFramework;
  version: string;
  description: string;
  status: ComplianceStatus;
  complianceScore: number;
  lastAssessment: string;
  nextAssessment?: string;
  requirements: ComplianceRequirement[];
  categories: {
    id: string;
    name: string;
    requirementCount: number;
    complianceScore: number;
  }[];
}

interface ComplianceReport {
  id: string;
  name: string;
  description: string;
  frameworks: string[];
  generatedAt: string;
  generatedBy: string;
  timeRange: TimeRange;
  format: 'pdf' | 'xlsx' | 'json' | 'html';
  url?: string;
  size?: number;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

/**
 * Uyum ve mevzuat raporlaması için servis sınıfı
 * Bu servis, çeşitli güvenlik standartları ve mevzuatlar için uyum raporlaması sağlar
 */
class ComplianceReportingService {
  /**
   * Mevcut uyum çerçevelerini getirir
   * @returns Uyum çerçevesi listesi
   */
  public static async getComplianceFrameworks(): Promise<ComplianceFrameworkDetails[]> {
    try {
      logger.debug('Fetching compliance frameworks');
      
      const response = await axios.get<ComplianceFrameworkDetails[]>(`${API_BASE_URL}/compliance/frameworks`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch compliance frameworks:', error);
      throw new Error('Uyum çerçeveleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir uyum çerçevesinin detaylarını getirir
   * @param frameworkId Çerçeve ID
   * @returns Çerçeve detayları
   */
  public static async getComplianceFrameworkById(frameworkId: string): Promise<ComplianceFrameworkDetails> {
    try {
      logger.debug(`Fetching compliance framework ${frameworkId}`);
      
      const response = await axios.get<ComplianceFrameworkDetails>(`${API_BASE_URL}/compliance/frameworks/${frameworkId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch compliance framework ${frameworkId}:`, error);
      throw new Error('Uyum çerçevesi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir uyum çerçevesinin gereksinimleri için kanıtları getirir
   * @param frameworkId Çerçeve ID
   * @param requirementId Gereksinim ID
   * @returns Kanıt listesi
   */
  public static async getComplianceEvidence(frameworkId: string, requirementId: string): Promise<any[]> {
    try {
      logger.debug(`Fetching compliance evidence for framework ${frameworkId}, requirement ${requirementId}`);
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/compliance/frameworks/${frameworkId}/requirements/${requirementId}/evidence`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch compliance evidence for framework ${frameworkId}, requirement ${requirementId}:`, error);
      throw new Error('Uyum kanıtları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Uyum raporu oluşturur
   * @param params Rapor parametreleri
   * @returns Oluşturulan rapor
   */
  public static async generateComplianceReport(params: {
    name: string;
    description?: string;
    frameworks: string[];
    timeRange: TimeRange;
    format: 'pdf' | 'xlsx' | 'json' | 'html';
  }): Promise<ComplianceReport> {
    try {
      logger.debug('Generating compliance report');
      
      const response = await axios.post<ComplianceReport>(`${API_BASE_URL}/compliance/reports/generate`, params);
      return response.data;
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw new Error('Uyum raporu oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Uyum raporlarını getirir
   * @returns Rapor listesi
   */
  public static async getComplianceReports(): Promise<ComplianceReport[]> {
    try {
      logger.debug('Fetching compliance reports');
      
      const response = await axios.get<ComplianceReport[]>(`${API_BASE_URL}/compliance/reports`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch compliance reports:', error);
      throw new Error('Uyum raporları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir uyum raporunun detaylarını getirir
   * @param reportId Rapor ID
   * @returns Rapor detayları
   */
  public static async getComplianceReportById(reportId: string): Promise<ComplianceReport> {
    try {
      logger.debug(`Fetching compliance report ${reportId}`);
      
      const response = await axios.get<ComplianceReport>(`${API_BASE_URL}/compliance/reports/${reportId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch compliance report ${reportId}:`, error);
      throw new Error('Uyum raporu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir uyum raporunu indirir
   * @param reportId Rapor ID
   * @returns Rapor dosyası
   */
  public static async downloadComplianceReport(reportId: string): Promise<Blob> {
    try {
      logger.debug(`Downloading compliance report ${reportId}`);
      
      const response = await axios.get(`${API_BASE_URL}/compliance/reports/${reportId}/download`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to download compliance report ${reportId}:`, error);
      throw new Error('Uyum raporu indirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Uyum durumu özet tablosunu getirir
   * @returns Uyum durumu özeti
   */
  public static async getComplianceDashboard(): Promise<any> {
    try {
      logger.debug('Fetching compliance dashboard');
      
      const response = await axios.get(`${API_BASE_URL}/compliance/dashboard`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch compliance dashboard:', error);
      throw new Error('Uyum durumu özeti alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir uyum gereksiniminin durumunu günceller
   * @param frameworkId Çerçeve ID
   * @param requirementId Gereksinim ID
   * @param status Yeni durum
   * @param notes Notlar
   * @returns Güncellenmiş gereksinim
   */
  public static async updateRequirementStatus(
    frameworkId: string,
    requirementId: string,
    status: ComplianceStatus,
    notes?: string
  ): Promise<ComplianceRequirement> {
    try {
      logger.debug(`Updating status of compliance requirement ${requirementId} to ${status}`);
      
      const response = await axios.patch<ComplianceRequirement>(
        `${API_BASE_URL}/compliance/frameworks/${frameworkId}/requirements/${requirementId}/status`,
        {
          status,
          notes
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to update status of compliance requirement ${requirementId}:`, error);
      throw new Error('Uyum gereksinimi durumu güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Uyum gereksinimi için kanıt ekler
   * @param frameworkId Çerçeve ID
   * @param requirementId Gereksinim ID
   * @param evidence Kanıt
   * @returns Eklenen kanıt
   */
  public static async addRequirementEvidence(
    frameworkId: string,
    requirementId: string,
    evidence: {
      type: string;
      description: string;
      data: any;
    }
  ): Promise<any> {
    try {
      logger.debug(`Adding evidence to compliance requirement ${requirementId}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/compliance/frameworks/${frameworkId}/requirements/${requirementId}/evidence`,
        evidence
      );
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to add evidence to compliance requirement ${requirementId}:`, error);
      throw new Error('Uyum gereksinimi kanıtı eklenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Mevzuat değişikliklerini getirir
   * @returns Mevzuat değişiklikleri
   */
  public static async getRegulatoryChanges(): Promise<any[]> {
    try {
      logger.debug('Fetching regulatory changes');
      
      const response = await axios.get<any[]>(`${API_BASE_URL}/compliance/regulatory-changes`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch regulatory changes:', error);
      throw new Error('Mevzuat değişiklikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Özel uyum çerçevesi oluşturur
   * @param framework Çerçeve bilgisi
   * @returns Oluşturulan çerçeve
   */
  public static async createCustomFramework(framework: Partial<ComplianceFrameworkDetails>): Promise<ComplianceFrameworkDetails> {
    try {
      logger.debug('Creating custom compliance framework');
      
      const response = await axios.post<ComplianceFrameworkDetails>(`${API_BASE_URL}/compliance/frameworks/custom`, framework);
      return response.data;
    } catch (error) {
      logger.error('Failed to create custom compliance framework:', error);
      throw new Error('Özel uyum çerçevesi oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
}

export {
  ComplianceReportingService,
  ComplianceFramework,
  ComplianceStatus,
  ComplianceRequirement,
  ComplianceFrameworkDetails,
  ComplianceReport
};
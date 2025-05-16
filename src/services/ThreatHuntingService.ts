import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { TimeRange } from '@/types/analytics';
import { logger } from '@/utils/logger';

interface HuntingRule {
  id: string;
  name: string;
  description: string;
  query: string;
  type: 'yara' | 'sigma' | 'lucene' | 'kql' | 'custom';
  tags: string[];
  category: string;
  author: string;
  created: string;
  updated: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  dataSources: string[];
  mitreTactics: string[];
  mitreTechniques: string[];
}

interface HuntingJob {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  timeRange: TimeRange;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  progress: number;
  startTime: string;
  endTime?: string;
  createdBy: string;
  resultsCount: number;
  error?: string;
}

interface HuntingResult {
  id: string;
  jobId: string;
  ruleId: string;
  timestamp: string;
  source: string;
  data: any;
  score: number;
  context: {
    before?: any[];
    after?: any[];
  };
  status: 'new' | 'investigating' | 'true_positive' | 'false_positive' | 'deferred';
  assignedTo?: string;
  notes?: string;
}

interface HuntingCase {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  createdBy: string;
  assignedTo?: string;
  tags: string[];
  resultIds: string[];
  relatedCases?: string[];
  timeline: {
    timestamp: string;
    message: string;
    user: string;
    type: 'status_change' | 'note' | 'evidence_added' | 'assignment';
  }[];
}

/**
 * Tehdit avcılığı (Threat Hunting) için servis sınıfı
 * Bu servis, ağda tehditler için proaktif olarak arama yapma yetenekleri sağlar
 */
class ThreatHuntingService {
  /**
   * Tüm avcılık kurallarını getirir
   * @returns Kural listesi
   */
  public static async getHuntingRules(): Promise<HuntingRule[]> {
    try {
      logger.debug('Fetching hunting rules');
      
      const response = await axios.get<HuntingRule[]>(`${API_BASE_URL}/hunting/rules`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch hunting rules:', error);
      throw new Error('Avcılık kuralları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir avcılık kuralının detaylarını getirir
   * @param ruleId Kural ID
   * @returns Kural detayları
   */
  public static async getHuntingRuleById(ruleId: string): Promise<HuntingRule> {
    try {
      logger.debug(`Fetching hunting rule ${ruleId}`);
      
      const response = await axios.get<HuntingRule>(`${API_BASE_URL}/hunting/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch hunting rule ${ruleId}:`, error);
      throw new Error('Avcılık kuralı alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir avcılık kuralı oluşturur
   * @param rule Kural bilgisi
   * @returns Oluşturulan kural
   */
  public static async createHuntingRule(rule: Partial<HuntingRule>): Promise<HuntingRule> {
    try {
      logger.debug('Creating new hunting rule');
      
      const response = await axios.post<HuntingRule>(`${API_BASE_URL}/hunting/rules`, rule);
      return response.data;
    } catch (error) {
      logger.error('Failed to create hunting rule:', error);
      throw new Error('Avcılık kuralı oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık kuralını günceller
   * @param ruleId Kural ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş kural
   */
  public static async updateHuntingRule(ruleId: string, updates: Partial<HuntingRule>): Promise<HuntingRule> {
    try {
      logger.debug(`Updating hunting rule ${ruleId}`);
      
      const response = await axios.put<HuntingRule>(`${API_BASE_URL}/hunting/rules/${ruleId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update hunting rule ${ruleId}:`, error);
      throw new Error('Avcılık kuralı güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık kuralını siler
   * @param ruleId Kural ID
   * @returns Silme durumu
   */
  public static async deleteHuntingRule(ruleId: string): Promise<any> {
    try {
      logger.debug(`Deleting hunting rule ${ruleId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/hunting/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete hunting rule ${ruleId}:`, error);
      throw new Error('Avcılık kuralı silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Avcılık işi (job) oluşturur ve çalıştırır
   * @param job İş bilgisi
   * @returns Oluşturulan iş
   */
  public static async createAndRunHuntingJob(job: Partial<HuntingJob>): Promise<HuntingJob> {
    try {
      logger.debug('Creating and running hunting job');
      
      const response = await axios.post<HuntingJob>(`${API_BASE_URL}/hunting/jobs`, job);
      return response.data;
    } catch (error) {
      logger.error('Failed to create and run hunting job:', error);
      throw new Error('Avcılık işi oluşturulamadı ve çalıştırılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm avcılık işlerini getirir
   * @param status İş durumu
   * @param limit Maksimum iş sayısı
   * @returns İş listesi
   */
  public static async getHuntingJobs(status?: HuntingJob['status'], limit: number = 100): Promise<HuntingJob[]> {
    try {
      logger.debug(`Fetching hunting jobs with status ${status}`);
      
      const response = await axios.get<HuntingJob[]>(`${API_BASE_URL}/hunting/jobs`, {
        params: {
          status,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch hunting jobs:', error);
      throw new Error('Avcılık işleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir avcılık işinin detaylarını getirir
   * @param jobId İş ID
   * @returns İş detayları
   */
  public static async getHuntingJobById(jobId: string): Promise<HuntingJob> {
    try {
      logger.debug(`Fetching hunting job ${jobId}`);
      
      const response = await axios.get<HuntingJob>(`${API_BASE_URL}/hunting/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch hunting job ${jobId}:`, error);
      throw new Error('Avcılık işi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir avcılık işini iptal eder
   * @param jobId İş ID
   * @returns İptal durumu
   */
  public static async cancelHuntingJob(jobId: string): Promise<any> {
    try {
      logger.debug(`Canceling hunting job ${jobId}`);
      
      const response = await axios.post(`${API_BASE_URL}/hunting/jobs/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to cancel hunting job ${jobId}:`, error);
      throw new Error('Avcılık işi iptal edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir avcılık işinin sonuçlarını getirir
   * @param jobId İş ID
   * @param status Sonuç durumu
   * @param limit Maksimum sonuç sayısı
   * @param offset Başlangıç indeksi
   * @returns Sonuç listesi
   */
  public static async getHuntingResults(
    jobId: string, 
    status?: HuntingResult['status'], 
    limit: number = 100,
    offset: number = 0
  ): Promise<HuntingResult[]> {
    try {
      logger.debug(`Fetching hunting results for job ${jobId}`);
      
      const response = await axios.get<HuntingResult[]>(`${API_BASE_URL}/hunting/jobs/${jobId}/results`, {
        params: {
          status,
          limit,
          offset
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch hunting results for job ${jobId}:`, error);
      throw new Error('Avcılık sonuçları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık sonucunun durumunu günceller
   * @param resultId Sonuç ID
   * @param status Yeni durum
   * @param notes Notlar
   * @returns Güncellenmiş sonuç
   */
  public static async updateHuntingResultStatus(resultId: string, status: HuntingResult['status'], notes?: string): Promise<HuntingResult> {
    try {
      logger.debug(`Updating status of hunting result ${resultId} to ${status}`);
      
      const response = await axios.patch<HuntingResult>(`${API_BASE_URL}/hunting/results/${resultId}/status`, {
        status,
        notes
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to update status of hunting result ${resultId}:`, error);
      throw new Error('Avcılık sonucu durumu güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık sonucunu bir kişiye atar
   * @param resultId Sonuç ID
   * @param userId Kullanıcı ID
   * @returns Güncellenmiş sonuç
   */
  public static async assignHuntingResult(resultId: string, userId: string): Promise<HuntingResult> {
    try {
      logger.debug(`Assigning hunting result ${resultId} to user ${userId}`);
      
      const response = await axios.patch<HuntingResult>(`${API_BASE_URL}/hunting/results/${resultId}/assign`, {
        userId
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to assign hunting result ${resultId} to user ${userId}:`, error);
      throw new Error('Avcılık sonucu atanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Avcılık sonuçlarından yeni bir vaka oluşturur
   * @param caseData Vaka bilgisi
   * @returns Oluşturulan vaka
   */
  public static async createHuntingCase(caseData: Partial<HuntingCase>): Promise<HuntingCase> {
    try {
      logger.debug('Creating new hunting case');
      
      const response = await axios.post<HuntingCase>(`${API_BASE_URL}/hunting/cases`, caseData);
      return response.data;
    } catch (error) {
      logger.error('Failed to create hunting case:', error);
      throw new Error('Avcılık vakası oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm avcılık vakalarını getirir
   * @param status Vaka durumu
   * @param limit Maksimum vaka sayısı
   * @returns Vaka listesi
   */
  public static async getHuntingCases(status?: HuntingCase['status'], limit: number = 100): Promise<HuntingCase[]> {
    try {
      logger.debug(`Fetching hunting cases with status ${status}`);
      
      const response = await axios.get<HuntingCase[]>(`${API_BASE_URL}/hunting/cases`, {
        params: {
          status,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch hunting cases:', error);
      throw new Error('Avcılık vakaları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir avcılık vakasının detaylarını getirir
   * @param caseId Vaka ID
   * @returns Vaka detayları
   */
  public static async getHuntingCaseById(caseId: string): Promise<HuntingCase> {
    try {
      logger.debug(`Fetching hunting case ${caseId}`);
      
      const response = await axios.get<HuntingCase>(`${API_BASE_URL}/hunting/cases/${caseId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch hunting case ${caseId}:`, error);
      throw new Error('Avcılık vakası alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık vakasını günceller
   * @param caseId Vaka ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş vaka
   */
  public static async updateHuntingCase(caseId: string, updates: Partial<HuntingCase>): Promise<HuntingCase> {
    try {
      logger.debug(`Updating hunting case ${caseId}`);
      
      const response = await axios.put<HuntingCase>(`${API_BASE_URL}/hunting/cases/${caseId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update hunting case ${caseId}:`, error);
      throw new Error('Avcılık vakası güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir avcılık vakasına not ekler
   * @param caseId Vaka ID
   * @param note Not
   * @returns Güncellenmiş vaka
   */
  public static async addNoteToCase(caseId: string, note: string): Promise<HuntingCase> {
    try {
      logger.debug(`Adding note to hunting case ${caseId}`);
      
      const response = await axios.post<HuntingCase>(`${API_BASE_URL}/hunting/cases/${caseId}/notes`, {
        note
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to add note to hunting case ${caseId}:`, error);
      throw new Error('Avcılık vakasına not eklenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Anlık bir sorgu çalıştırır ve sonuçları getirir
   * @param query Sorgu
   * @param timeRange Zaman aralığı
   * @param dataSource Veri kaynağı
   * @returns Sorgu sonuçları
   */
  public static async runAdHocQuery(query: string, timeRange: TimeRange, dataSource: string): Promise<any[]> {
    try {
      logger.debug(`Running ad-hoc query on data source ${dataSource}`);
      
      const response = await axios.post(`${API_BASE_URL}/hunting/query`, {
        query,
        timeRange,
        dataSource
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to run ad-hoc query on data source ${dataSource}:`, error);
      throw new Error('Anlık sorgu çalıştırılamadı. Lütfen tekrar deneyin.');
    }
  }
}

export {
  ThreatHuntingService,
  HuntingRule,
  HuntingJob,
  HuntingResult,
  HuntingCase
};
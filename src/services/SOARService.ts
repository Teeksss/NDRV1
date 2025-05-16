import axios from 'axios';
import { API_BASE_URL } from '@/config/app.config';
import { logger } from '@/utils/logger';

type PlaybookTrigger = 'alert' | 'anomaly' | 'threshold' | 'scheduled' | 'manual';
type PlaybookStatus = 'idle' | 'running' | 'completed' | 'failed' | 'canceled';
type ActionType = 'notification' | 'containment' | 'enrichment' | 'remediation' | 'investigation';

interface Playbook {
  id: string;
  name: string;
  description: string;
  triggers: PlaybookTrigger[];
  conditions: any[];
  actions: PlaybookAction[];
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRun?: string;
  runCount: number;
  successRate: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
}

interface PlaybookAction {
  id: string;
  name: string;
  type: ActionType;
  parameters: Record<string, any>;
  timeout: number;
  retryEnabled: boolean;
  retryCount: number;
  retryDelay: number;
  runAsSoon: boolean;
  requiresApproval: boolean;
  approvalGroups?: string[];
  onSuccess?: string;
  onFailure?: string;
}

interface PlaybookRun {
  id: string;
  playbookId: string;
  triggerId: string;
  triggerType: PlaybookTrigger;
  status: PlaybookStatus;
  startTime: string;
  endTime?: string;
  executionTime?: number;
  actions: PlaybookActionRun[];
  success: boolean;
  error?: string;
  triggeredBy: string;
  variables: Record<string, any>;
}

interface PlaybookActionRun {
  id: string;
  actionId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'awaiting_approval';
  startTime?: string;
  endTime?: string;
  executionTime?: number;
  output?: any;
  error?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalTime?: string;
  notes?: string;
}

/**
 * Güvenlik Otomasyonu ve Yanıt (SOAR) için servis sınıfı
 * Bu servis, güvenlik olaylarına otomatik yanıt vermek için playbook yönetimini sağlar
 */
class SOARService {
  /**
   * Tüm playbookları getirir
   * @returns Playbook listesi
   */
  public static async getPlaybooks(): Promise<Playbook[]> {
    try {
      logger.debug('Fetching SOAR playbooks');
      
      const response = await axios.get<Playbook[]>(`${API_BASE_URL}/soar/playbooks`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch SOAR playbooks:', error);
      throw new Error('Playbooklar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Belirli bir playbookun detaylarını getirir
   * @param playbookId Playbook ID
   * @returns Playbook detayları
   */
  public static async getPlaybookById(playbookId: string): Promise<Playbook> {
    try {
      logger.debug(`Fetching SOAR playbook ${playbookId}`);
      
      const response = await axios.get<Playbook>(`${API_BASE_URL}/soar/playbooks/${playbookId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook detayları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Yeni bir playbook oluşturur
   * @param playbook Playbook bilgileri
   * @returns Oluşturulan playbook
   */
  public static async createPlaybook(playbook: Partial<Playbook>): Promise<Playbook> {
    try {
      logger.debug('Creating new SOAR playbook');
      
      const response = await axios.post<Playbook>(`${API_BASE_URL}/soar/playbooks`, playbook);
      return response.data;
    } catch (error) {
      logger.error('Failed to create SOAR playbook:', error);
      throw new Error('Playbook oluşturulamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbookü günceller
   * @param playbookId Playbook ID
   * @param updates Güncellemeler
   * @returns Güncellenmiş playbook
   */
  public static async updatePlaybook(playbookId: string, updates: Partial<Playbook>): Promise<Playbook> {
    try {
      logger.debug(`Updating SOAR playbook ${playbookId}`);
      
      const response = await axios.put<Playbook>(`${API_BASE_URL}/soar/playbooks/${playbookId}`, updates);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook güncellenemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbookü siler
   * @param playbookId Playbook ID
   * @returns Silme durumu
   */
  public static async deletePlaybook(playbookId: string): Promise<any> {
    try {
      logger.debug(`Deleting SOAR playbook ${playbookId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/soar/playbooks/${playbookId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to delete SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook silinemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbookü etkinleştirir veya devre dışı bırakır
   * @param playbookId Playbook ID
   * @param enabled Etkinleştirme durumu
   * @returns Güncellenmiş playbook
   */
  public static async togglePlaybook(playbookId: string, enabled: boolean): Promise<Playbook> {
    try {
      logger.debug(`Toggling SOAR playbook ${playbookId} to ${enabled ? 'enabled' : 'disabled'}`);
      
      const response = await axios.patch<Playbook>(`${API_BASE_URL}/soar/playbooks/${playbookId}/toggle`, {
        enabled
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to toggle SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook durumu değiştirilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbookü manuel olarak çalıştırır
   * @param playbookId Playbook ID
   * @param variables Çalıştırma değişkenleri
   * @returns Çalıştırma detayları
   */
  public static async runPlaybook(playbookId: string, variables?: Record<string, any>): Promise<PlaybookRun> {
    try {
      logger.debug(`Running SOAR playbook ${playbookId} manually`);
      
      const response = await axios.post<PlaybookRun>(`${API_BASE_URL}/soar/playbooks/${playbookId}/run`, {
        variables: variables || {}
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to run SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook çalıştırılamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbook çalıştırmasının durumunu getirir
   * @param runId Çalıştırma ID
   * @returns Çalıştırma durumu
   */
  public static async getPlaybookRunStatus(runId: string): Promise<PlaybookRun> {
    try {
      logger.debug(`Fetching SOAR playbook run status ${runId}`);
      
      const response = await axios.get<PlaybookRun>(`${API_BASE_URL}/soar/runs/${runId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch SOAR playbook run status ${runId}:`, error);
      throw new Error('Playbook çalıştırma durumu alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbook çalıştırmasını iptal eder
   * @param runId Çalıştırma ID
   * @returns İptal durumu
   */
  public static async cancelPlaybookRun(runId: string): Promise<any> {
    try {
      logger.debug(`Canceling SOAR playbook run ${runId}`);
      
      const response = await axios.post(`${API_BASE_URL}/soar/runs/${runId}/cancel`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to cancel SOAR playbook run ${runId}:`, error);
      throw new Error('Playbook çalıştırması iptal edilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbook için çalıştırma geçmişini getirir
   * @param playbookId Playbook ID
   * @param limit Maksimum kayıt sayısı
   * @returns Çalıştırma geçmişi
   */
  public static async getPlaybookRunHistory(playbookId: string, limit: number = 10): Promise<PlaybookRun[]> {
    try {
      logger.debug(`Fetching run history for SOAR playbook ${playbookId}`);
      
      const response = await axios.get<PlaybookRun[]>(`${API_BASE_URL}/soar/playbooks/${playbookId}/history`, {
        params: { limit }
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch run history for SOAR playbook ${playbookId}:`, error);
      throw new Error('Playbook çalıştırma geçmişi alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Tüm playbook çalıştırmalarını getirir
   * @param status Çalıştırma durumu
   * @param limit Maksimum kayıt sayısı
   * @returns Çalıştırma listesi
   */
  public static async getAllPlaybookRuns(status?: PlaybookStatus, limit: number = 50): Promise<PlaybookRun[]> {
    try {
      logger.debug(`Fetching all SOAR playbook runs with status: ${status}`);
      
      const response = await axios.get<PlaybookRun[]>(`${API_BASE_URL}/soar/runs`, {
        params: { 
          status,
          limit 
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch all SOAR playbook runs:', error);
      throw new Error('Playbook çalıştırmaları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Onay bekleyen playbook aksiyonlarını getirir
   * @returns Onay bekleyen aksiyonlar
   */
  public static async getPendingApprovals(): Promise<PlaybookActionRun[]> {
    try {
      logger.debug('Fetching pending approvals for SOAR playbook actions');
      
      const response = await axios.get<PlaybookActionRun[]>(`${API_BASE_URL}/soar/approvals`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch pending approvals for SOAR playbook actions:', error);
      throw new Error('Onay bekleyen aksiyonlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbook aksiyonunu onaylar
   * @param actionRunId Aksiyon çalıştırma ID
   * @param notes Notlar
   * @returns Onay durumu
   */
  public static async approveAction(actionRunId: string, notes?: string): Promise<PlaybookActionRun> {
    try {
      logger.debug(`Approving SOAR playbook action ${actionRunId}`);
      
      const response = await axios.post<PlaybookActionRun>(`${API_BASE_URL}/soar/approvals/${actionRunId}/approve`, {
        notes
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to approve SOAR playbook action ${actionRunId}:`, error);
      throw new Error('Aksiyon onaylanamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Bir playbook aksiyonunu reddeder
   * @param actionRunId Aksiyon çalıştırma ID
   * @param notes Notlar
   * @returns Red durumu
   */
  public static async rejectAction(actionRunId: string, notes?: string): Promise<PlaybookActionRun> {
    try {
      logger.debug(`Rejecting SOAR playbook action ${actionRunId}`);
      
      const response = await axios.post<PlaybookActionRun>(`${API_BASE_URL}/soar/approvals/${actionRunId}/reject`, {
        notes
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to reject SOAR playbook action ${actionRunId}:`, error);
      throw new Error('Aksiyon reddedilemedi. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * Mevcut aksiyon şablonlarını getirir
   * @returns Aksiyon şablonları
   */
  public static async getActionTemplates(): Promise<any> {
    try {
      logger.debug('Fetching SOAR action templates');
      
      const response = await axios.get(`${API_BASE_URL}/soar/actions/templates`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch SOAR action templates:', error);
      throw new Error('Aksiyon şablonları alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * SOAR entegrasyonlarını getirir
   * @returns Entegrasyonlar
   */
  public static async getIntegrations(): Promise<any> {
    try {
      logger.debug('Fetching SOAR integrations');
      
      const response = await axios.get(`${API_BASE_URL}/soar/integrations`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch SOAR integrations:', error);
      throw new Error('Entegrasyonlar alınamadı. Lütfen tekrar deneyin.');
    }
  }
  
  /**
   * SOAR metriklerini getirir
   * @returns Metrikler
   */
  public static async getMetrics(): Promise<any> {
    try {
      logger.debug('Fetching SOAR metrics');
      
      const response = await axios.get(`${API_BASE_URL}/soar/metrics`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch SOAR metrics:', error);
      throw new Error('SOAR metrikleri alınamadı. Lütfen tekrar deneyin.');
    }
  }
}

export { 
  SOARService,
  Playbook,
  PlaybookAction,
  PlaybookRun,
  PlaybookActionRun,
  PlaybookTrigger,
  PlaybookStatus,
  ActionType
};
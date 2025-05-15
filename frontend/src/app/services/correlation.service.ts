import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CorrelationRule } from '../models/correlation-rule.model';

@Injectable({
  providedIn: 'root'
})
export class CorrelationService {
  private endpoint = 'correlation/rules';

  constructor(private apiService: ApiService) { }

  /**
   * Get all correlation rules with optional filtering
   */
  getRules(params: any = {}): Observable<any> {
    return this.apiService.get<any>(this.endpoint, params);
  }

  /**
   * Get correlation rule by ID
   */
  getRule(id: string): Observable<CorrelationRule> {
    return this.apiService.get<CorrelationRule>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new correlation rule
   */
  createRule(ruleData: any): Observable<CorrelationRule> {
    return this.apiService.post<CorrelationRule>(this.endpoint, ruleData);
  }

  /**
   * Update correlation rule
   */
  updateRule(id: string, ruleData: any): Observable<CorrelationRule> {
    return this.apiService.put<CorrelationRule>(`${this.endpoint}/${id}`, ruleData);
  }

  /**
   * Partially update correlation rule
   */
  patchRule(id: string, ruleData: any): Observable<CorrelationRule> {
    return this.apiService.patch<CorrelationRule>(`${this.endpoint}/${id}`, ruleData);
  }

  /**
   * Delete correlation rule
   */
  deleteRule(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Enable correlation rule
   */
  enableRule(id: string): Observable<CorrelationRule> {
    return this.apiService.patch<CorrelationRule>(`${this.endpoint}/${id}/enable`, {});
  }

  /**
   * Disable correlation rule
   */
  disableRule(id: string): Observable<CorrelationRule> {
    return this.apiService.patch<CorrelationRule>(`${this.endpoint}/${id}/disable`, {});
  }

  /**
   * Test correlation rule against sample events
   */
  testRule(id: string, events: any[]): Observable<any> {
    return this.apiService.post<any>(`${this.endpoint}/${id}/test`, { events });
  }

  /**
   * Get rule statistics
   */
  getStatistics(): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/statistics`);
  }

  /**
   * Get operator display text
   */
  getOperatorText(operator: string): string {
    switch (operator) {
      case 'eq': return 'equals';
      case 'neq': return 'not equals';
      case 'gt': return 'greater than';
      case 'gte': return 'greater than or equal';
      case 'lt': return 'less than';
      case 'lte': return 'less than or equal';
      case 'in': return 'in';
      case 'nin': return 'not in';
      case 'contains': return 'contains';
      case 'notContains': return 'not contains';
      case 'startsWith': return 'starts with';
      case 'endsWith': return 'ends with';
      case 'match': return 'matches regex';
      case 'exists': return 'exists';
      case 'notExists': return 'not exists';
      default: return operator;
    }
  }

  /**
   * Get rule type display text
   */
  getRuleTypeText(type: string): string {
    switch (type) {
      case 'simple': return 'Simple';
      case 'threshold': return 'Threshold';
      case 'sequence': return 'Sequence';
      case 'aggregation': return 'Aggregation';
      case 'pattern': return 'Pattern';
      default: return type;
    }
  }
}
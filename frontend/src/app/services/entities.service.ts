import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Entity } from '../models/entity.model';

@Injectable({
  providedIn: 'root'
})
export class EntitiesService {
  private endpoint = 'entities';

  constructor(private apiService: ApiService) { }

  /**
   * Get all entities with optional filtering
   */
  getEntities(params: any = {}): Observable<any> {
    return this.apiService.get<any>(this.endpoint, params);
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): Observable<Entity> {
    return this.apiService.get<Entity>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new entity
   */
  createEntity(entityData: any): Observable<Entity> {
    return this.apiService.post<Entity>(this.endpoint, entityData);
  }

  /**
   * Update entity
   */
  updateEntity(id: string, entityData: any): Observable<Entity> {
    return this.apiService.patch<Entity>(`${this.endpoint}/${id}`, entityData);
  }

  /**
   * Delete entity
   */
  deleteEntity(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Add tag to entity
   */
  addTagToEntity(entityId: string, tag: string): Observable<Entity> {
    return this.apiService.post<Entity>(`${this.endpoint}/${entityId}/tags`, { tag });
  }

  /**
   * Remove tag from entity
   */
  removeTagFromEntity(entityId: string, tag: string): Observable<Entity> {
    return this.apiService.delete<Entity>(`${this.endpoint}/${entityId}/tags/${tag}`);
  }

  /**
   * Get entity statistics
   */
  getStatistics(): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/statistics`);
  }

  /**
   * Get entity risk history
   */
  getRiskHistory(id: string, params: any = {}): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/${id}/risk-history`, params);
  }

  /**
   * Get related entities
   */
  getRelatedEntities(id: string): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/${id}/related`);
  }

  /**
   * Get entity type class for CSS
   */
  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'server':
        return 'entity-type-server';
      case 'workstation':
        return 'entity-type-workstation';
      case 'network_device':
        return 'entity-type-network-device';
      case 'iot_device':
        return 'entity-type-iot';
      case 'user':
        return 'entity-type-user';
      default:
        return '';
    }
  }

  /**
   * Get risk score class for CSS
   */
  getRiskScoreClass(score: number): string {
    if (score >= 80) return 'risk-critical';
    if (score >= 60) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    if (score >= 20) return 'risk-low';
    return 'risk-none';
  }
}
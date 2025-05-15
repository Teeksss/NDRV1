import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Event } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private endpoint = 'events';

  constructor(private apiService: ApiService) { }

  /**
   * Get all events with optional filtering
   */
  getEvents(params: any = {}): Observable<any> {
    return this.apiService.get<any>(this.endpoint, params);
  }

  /**
   * Get event by ID
   */
  getEvent(id: string): Observable<Event> {
    return this.apiService.get<Event>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new event
   */
  createEvent(eventData: any): Observable<Event> {
    return this.apiService.post<Event>(this.endpoint, eventData);
  }

  /**
   * Update event
   */
  updateEvent(id: string, eventData: any): Observable<Event> {
    return this.apiService.patch<Event>(`${this.endpoint}/${id}`, eventData);
  }

  /**
   * Delete event
   */
  deleteEvent(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Get related events
   */
  getRelatedEvents(id: string): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/${id}/related`);
  }

  /**
   * Get event statistics
   */
  getStatistics(params: any = {}): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/statistics`, params);
  }

  /**
   * Create alert from event
   */
  createAlertFromEvent(eventId: string, alertData: any): Observable<any> {
    return this.apiService.post<any>(`${this.endpoint}/${eventId}/alerts`, alertData);
  }

  /**
   * Get type class for CSS
   */
  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'authentication':
        return 'event-type-authentication';
      case 'network':
        return 'event-type-network';
      case 'system':
        return 'event-type-system';
      case 'security':
        return 'event-type-security';
      case 'application':
        return 'event-type-application';
      default:
        return '';
    }
  }
}
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private endpoint = 'notifications';

  constructor(
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(params: any = {}): Observable<any> {
    return this.apiService.get<any>(this.endpoint, params);
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): Observable<Notification> {
    return this.apiService.get<Notification>(`${this.endpoint}/${id}`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): Observable<Notification> {
    return this.apiService.patch<Notification>(`${this.endpoint}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.apiService.post<any>(`${this.endpoint}/mark-all-read`, {});
  }

  /**
   * Delete notification
   */
  deleteNotification(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/unread-count`);
  }

  /**
   * Create notification
   */
  createNotification(data: any): Observable<Notification> {
    return this.apiService.post<Notification>(this.endpoint, data);
  }

  /**
   * Show a snackbar notification
   */
  showNotification(message: string, type: string = 'info', link?: string): void {
    const panelClass = `notification-${type}`;
    
    const ref = this.snackBar.open(message, link ? 'View' : 'Close', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
    
    if (link) {
      ref.onAction().subscribe(() => {
        this.router.navigate([link]);
      });
    }
  }

  /**
   * Get notification type class for CSS
   */
  getTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'alert':
        return 'notification-type-alert';
      case 'system':
        return 'notification-type-system';
      case 'info':
        return 'notification-type-info';
      case 'warning':
        return 'notification-type-warning';
      case 'error':
        return 'notification-type-error';
      default:
        return '';
    }
  }
}
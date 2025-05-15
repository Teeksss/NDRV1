import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Dashboard } from '../models/dashboard.model';
import { Widget } from '../models/widget.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private endpoint = 'dashboards';

  constructor(private apiService: ApiService) { }

  /**
   * Get all dashboards
   */
  getDashboards(): Observable<Dashboard[]> {
    return this.apiService.get<Dashboard[]>(this.endpoint);
  }

  /**
   * Get dashboard by ID
   */
  getDashboard(id: string): Observable<Dashboard> {
    return this.apiService.get<Dashboard>(`${this.endpoint}/${id}`);
  }

  /**
   * Get default dashboard
   */
  getDefaultDashboard(): Observable<Dashboard> {
    return this.apiService.get<Dashboard>(`${this.endpoint}/default`);
  }

  /**
   * Create new dashboard
   */
  createDashboard(dashboardData: any): Observable<Dashboard> {
    return this.apiService.post<Dashboard>(this.endpoint, dashboardData);
  }

  /**
   * Update dashboard
   */
  updateDashboard(id: string, dashboardData: any): Observable<Dashboard> {
    return this.apiService.patch<Dashboard>(`${this.endpoint}/${id}`, dashboardData);
  }

  /**
   * Delete dashboard
   */
  deleteDashboard(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  /**
   * Get widgets for a dashboard
   */
  getWidgets(dashboardId: string): Observable<any> {
    return this.apiService.get<any>(`${this.endpoint}/${dashboardId}/widgets`);
  }

  /**
   * Get widget data
   */
  getWidgetData(widgetId: string, params: any = {}): Observable<any> {
    return this.apiService.get<any>(`widgets/${widgetId}/data`, params);
  }

  /**
   * Create widget
   */
  createWidget(dashboardId: string, widgetData: any): Observable<Widget> {
    return this.apiService.post<Widget>(`${this.endpoint}/${dashboardId}/widgets`, widgetData);
  }

  /**
   * Update widget
   */
  updateWidget(widgetId: string, widgetData: any): Observable<Widget> {
    return this.apiService.patch<Widget>(`widgets/${widgetId}`, widgetData);
  }

  /**
   * Delete widget
   */
  deleteWidget(widgetId: string): Observable<any> {
    return this.apiService.delete<any>(`widgets/${widgetId}`);
  }

  /**
   * Update widget positions in bulk
   */
  updateWidgetPositions(dashboardId: string, positionsData: any): Observable<any> {
    return this.apiService.patch<any>(`${this.endpoint}/${dashboardId}/widget-positions`, positionsData);
  }

  /**
   * Get available widget types
   */
  getWidgetTypes(): Observable<any> {
    return this.apiService.get<any>('widgets/types');
  }

  /**
   * Set default dashboard
   */
  setDefaultDashboard(dashboardId: string): Observable<any> {
    return this.apiService.post<any>(`${this.endpoint}/${dashboardId}/set-default`, {});
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): Observable<any> {
    return this.apiService.get<any>('metrics/system');
  }

  /**
   * Get application metrics
   */
  getApplicationMetrics(): Observable<any> {
    return this.apiService.get<any>('metrics/application');
  }
}
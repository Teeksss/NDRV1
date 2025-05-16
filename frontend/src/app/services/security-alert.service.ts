import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WebSocketService } from './websocket.service';

@Injectable({
    providedIn: 'root'
})
export class SecurityAlertService {
    private readonly apiUrl = `${environment.apiUrl}/security/alerts`;
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:01:21',
        maintainer: 'Teeksss',
        version: '3.2.2',
        buildNumber: '202505160701'
    };

    private alertsSubject = new BehaviorSubject<any[]>([]);

    constructor(
        private http: HttpClient,
        private wsService: WebSocketService
    ) {
        this.initializeRealTimeAlerts();
    }

    getAlerts(): Observable<any[]> {
        return this.alertsSubject.asObservable();
    }

    async acknowledgeAlert(alertId: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/${alertId}/acknowledge`, {
                timestamp: new Date().toISOString(),
                acknowledgedBy: this.serviceInfo.maintainer
            }).toPromise();

            this.updateAlertStatus(alertId, 'acknowledged');
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
            throw error;
        }
    }

    async resolveAlert(alertId: string, resolution: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/${alertId}/resolve`, {
                resolution,
                timestamp: new Date().toISOString(),
                resolvedBy: this.serviceInfo.maintainer
            }).toPromise();

            this.updateAlertStatus(alertId, 'resolved');
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            throw error;
        }
    }

    private initializeRealTimeAlerts(): void {
        this.wsService.connect(`${environment.wsUrl}/security/alerts`)
            .subscribe(
                message => this.handleWebSocketMessage(message),
                error => console.error('WebSocket connection error:', error)
            );
    }

    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'NEW_ALERT':
                this.addNewAlert(message.data);
                break;
            case 'UPDATE_ALERT':
                this.updateAlert(message.data);
                break;
            case 'DELETE_ALERT':
                this.deleteAlert(message.data.id);
                break;
        }
    }

    private addNewAlert(alert: any): void {
        const currentAlerts = this.alertsSubject.value;
        this.alertsSubject.next([alert, ...currentAlerts]);
    }

    private updateAlert(updatedAlert: any): void {
        const currentAlerts = this.alertsSubject.value;
        const updatedAlerts = currentAlerts.map(alert =>
            alert.id === updatedAlert.id ? { ...alert, ...updatedAlert } : alert
        );
        this.alertsSubject.next(updatedAlerts);
    }

    private deleteAlert(alertId: string): void {
        const currentAlerts = this.alertsSubject.value;
        this.alertsSubject.next(currentAlerts.filter(alert => alert.id !== alertId));
    }

    private updateAlertStatus(alertId: string, status: string): void {
        const currentAlerts = this.alertsSubject.value;
        const updatedAlerts = currentAlerts.map(alert =>
            alert.id === alertId ? { ...alert, status } : alert
        );
        this.alertsSubject.next(updatedAlerts);
    }
}
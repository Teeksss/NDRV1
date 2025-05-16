import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SecurityService {
    private readonly apiUrl = environment.apiUrl;
    private readonly serviceInfo = {
        timestamp: '2025-05-16 06:51:00',
        maintainer: 'Teeksss',
        version: '3.2.0',
        buildNumber: '202505160651'
    };

    private systemStatusSubject = new BehaviorSubject<any>(null);
    private wsConnection: WebSocket;

    constructor(private http: HttpClient) {
        this.initializeWebSocket();
    }

    getSystemStatus(): Observable<any> {
        return this.systemStatusSubject.asObservable();
    }

    async refreshSystemStatus(): Promise<void> {
        try {
            const status = await this.http.get(`${this.apiUrl}/security/status`).toPromise();
            this.systemStatusSubject.next(status);
        } catch (error) {
            console.error('Failed to refresh system status:', error);
        }
    }

    private initializeWebSocket() {
        this.wsConnection = new WebSocket(`${environment.wsUrl}/security`);
        
        this.wsConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.wsConnection.onclose = () => {
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }

    private handleWebSocketMessage(data: any) {
        switch (data.type) {
            case 'STATUS_UPDATE':
                this.systemStatusSubject.next(data.payload);
                break;
            case 'SECURITY_ALERT':
                this.handleSecurityAlert(data.payload);
                break;
            default:
                console.log('Unhandled websocket message:', data);
        }
    }

    private handleSecurityAlert(alert: any) {
        // Alert işleme mantığı
    }

    // Diğer güvenlik metodları...
}
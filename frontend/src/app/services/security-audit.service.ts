import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SecurityAuditService {
    private readonly apiUrl = `${environment.apiUrl}/security/audit`;
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:03:11',
        maintainer: 'Teeksss',
        version: '3.2.3',
        buildNumber: '202505160703'
    };

    private auditLogsSubject = new BehaviorSubject<any[]>([]);

    constructor(private http: HttpClient) {}

    getAuditLogs(filters?: AuditLogFilters): Observable<any[]> {
        return new Observable(observer => {
            this.fetchAuditLogs(filters)
                .then(logs => {
                    this.auditLogsSubject.next(logs);
                    observer.next(logs);
                    observer.complete();
                })
                .catch(error => observer.error(error));
        });
    }

    async createAuditEntry(entry: AuditEntry): Promise<void> {
        try {
            const enrichedEntry = {
                ...entry,
                timestamp: new Date().toISOString(),
                creator: this.serviceInfo.maintainer,
                serviceVersion: this.serviceInfo.version
            };

            await this.http.post(this.apiUrl, enrichedEntry).toPromise();
            await this.refreshAuditLogs();
        } catch (error) {
            console.error('Failed to create audit entry:', error);
            throw error;
        }
    }

    async exportAuditLogs(format: 'csv' | 'pdf', filters?: AuditLogFilters): Promise<Blob> {
        try {
            const response = await this.http.post(
                `${this.apiUrl}/export`,
                { format, filters },
                { responseType: 'blob' }
            ).toPromise();

            return new Blob([response], {
                type: format === 'csv' ? 'text/csv' : 'application/pdf'
            });
        } catch (error) {
            console.error('Failed to export audit logs:', error);
            throw error;
        }
    }

    private async fetchAuditLogs(filters?: AuditLogFilters): Promise<any[]> {
        try {
            const response = await this.http.get(this.apiUrl, {
                params: {
                    ...filters,
                    version: this.serviceInfo.version
                }
            }).toPromise();

            return this.processAuditLogs(response);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            throw error;
        }
    }

    private async refreshAuditLogs(): Promise<void> {
        const logs = await this.fetchAuditLogs();
        this.auditLogsSubject.next(logs);
    }

    private processAuditLogs(logs: any[]): any[] {
        return logs.map(log => ({
            ...log,
            processedAt: new Date().toISOString(),
            processedBy: this.serviceInfo.maintainer
        }));
    }
}

interface AuditLogFilters {
    startDate?: string;
    endDate?: string;
    severity?: string;
    type?: string;
    user?: string;
}

interface AuditEntry {
    type: string;
    description: string;
    severity: string;
    metadata?: Record<string, any>;
}
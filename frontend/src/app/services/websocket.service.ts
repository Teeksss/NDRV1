import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retryWhen, delay, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:03:11',
        maintainer: 'Teeksss',
        version: '3.2.3',
        buildNumber: '202505160703'
    };

    private socket$: WebSocketSubject<any>;
    private messagesSubject = new Subject<any>();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 5000;

    connect(url: string): Observable<any> {
        if (!this.socket$ || this.socket$.closed) {
            this.socket$ = this.createWebSocket(url);
            this.setupSocketConnection();
        }
        return this.messagesSubject.asObservable();
    }

    private createWebSocket(url: string): WebSocketSubject<any> {
        return webSocket({
            url,
            openObserver: {
                next: () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.sendServiceInfo();
                }
            },
            closeObserver: {
                next: () => {
                    console.log('WebSocket disconnected');
                    this.handleDisconnection();
                }
            }
        });
    }

    private setupSocketConnection(): void {
        this.socket$.pipe(
            retryWhen(errors =>
                errors.pipe(
                    tap(error => {
                        console.error('WebSocket error:', error);
                        this.reconnectAttempts++;
                    }),
                    delay(this.reconnectInterval)
                )
            )
        ).subscribe(
            message => this.handleMessage(message),
            error => this.handleError(error)
        );
    }

    private handleMessage(message: any): void {
        this.messagesSubject.next({
            ...message,
            receivedAt: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private handleError(error: any): void {
        console.error('WebSocket error:', error);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
        } else {
            this.messagesSubject.error(new Error('Max reconnection attempts reached'));
        }
    }

    private handleDisconnection(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
        }
    }

    private reconnect(): void {
        timer(this.reconnectInterval).subscribe(() => {
            console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.setupSocketConnection();
        });
    }

    private sendServiceInfo(): void {
        this.send({
            type: 'SERVICE_INFO',
            data: this.serviceInfo
        });
    }

    send(message: any): void {
        if (this.socket$ && !this.socket$.closed) {
            this.socket$.next({
                ...message,
                timestamp: new Date().toISOString(),
                sender: this.serviceInfo.maintainer
            });
        }
    }

    disconnect(): void {
        if (this.socket$) {
            this.socket$.complete();
        }
    }
}
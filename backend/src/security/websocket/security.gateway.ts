import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    namespace: '/security',
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})
export class SecurityWebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('SecurityWebSocketGateway');
    private readonly serviceInfo = {
        timestamp: '2025-05-16 07:04:06',
        maintainer: 'Teeksss',
        version: '3.2.4',
        buildNumber: '202505160704'
    };

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway Initialized');
        this.setupHeartbeat();
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.sendWelcomeMessage(client);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinSecurityChannel')
    handleJoinChannel(client: Socket, payload: any): void {
        this.logger.log(`Client ${client.id} joined channel: ${payload.channel}`);
        client.join(payload.channel);
        this.sendChannelInfo(client, payload.channel);
    }

    @SubscribeMessage('leaveSecurityChannel')
    handleLeaveChannel(client: Socket, payload: any): void {
        this.logger.log(`Client ${client.id} left channel: ${payload.channel}`);
        client.leave(payload.channel);
    }

    @SubscribeMessage('securityAlert')
    handleSecurityAlert(client: Socket, payload: any): void {
        this.logger.log(`Security alert received from ${client.id}`);
        this.broadcastSecurityAlert(payload);
    }

    private setupHeartbeat(): void {
        setInterval(() => {
            this.server.emit('heartbeat', {
                timestamp: new Date().toISOString(),
                serviceInfo: this.serviceInfo
            });
        }, 30000);
    }

    private sendWelcomeMessage(client: Socket): void {
        client.emit('welcome', {
            message: 'Connected to Security WebSocket Server',
            timestamp: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private sendChannelInfo(client: Socket, channel: string): void {
        client.emit('channelInfo', {
            channel,
            timestamp: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    private broadcastSecurityAlert(alert: any): void {
        this.server.emit('securityAlertBroadcast', {
            ...alert,
            timestamp: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    public broadcastMetricsUpdate(metrics: any): void {
        this.server.emit('metricsUpdate', {
            ...metrics,
            timestamp: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }

    public notifyClients(event: string, data: any): void {
        this.server.emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
            serviceInfo: this.serviceInfo
        });
    }
}
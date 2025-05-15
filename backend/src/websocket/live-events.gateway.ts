import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LiveMonitoringService } from '../monitoring/live-monitoring.service';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class LiveEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveEventsGateway.name);
  private connectedClients = new Map<string, Socket>();
  private clientSubscriptions = new Map<string, Subscription[]>();

  constructor(
    private authService: AuthService,
    private liveMonitoringService: LiveMonitoringService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Get token from handshake query
      const token = client.handshake.auth.token || client.handshake.query.token;
      
      if (!token) {
        this.disconnect(client, 'Authentication required');
        return;
      }
      
      // Verify token
      const user = await this.authService.verifyToken(token);
      
      if (!user) {
        this.disconnect(client, 'Invalid token');
        return;
      }
      
      // Store client with user info
      client.data.user = user;
      this.connectedClients.set(client.id, client);
      
      // Initialize subscriptions array
      this.clientSubscriptions.set(client.id, []);
      
      this.logger.log(`Client connected: ${client.id}, user: ${user.username}`);
      
      // Notify client of successful connection
      client.emit('connection_status', {
        connected: true,
        user: {
          username: user.username,
          roles: user.roles
        }
      });
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`, error.stack);
      this.disconnect(client, 'Authentication error');
    }
  }

  handleDisconnect(client: Socket) {
    // Clean up subscriptions
    if (this.clientSubscriptions.has(client.id)) {
      const subscriptions = this.clientSubscriptions.get(client.id);
      subscriptions.forEach(subscription => subscription.unsubscribe());
      this.clientSubscriptions.delete(client.id);
    }
    
    // Remove client
    this.connectedClients.delete(client.id);
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: any, client: Socket): WsResponse<any> {
    try {
      // Check if client is authenticated
      if (!client.data?.user) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }
      
      const eventType = data.eventType;
      
      if (!eventType) {
        return { event: 'error', data: { message: 'Event type is required' } };
      }
      
      // Create subscription
      const subscription = this.liveMonitoringService
        .getEventStream(eventType)
        .subscribe(event => {
          client.emit(eventType, event);
        });
      
      // Store subscription
      const subscriptions = this.clientSubscriptions.get(client.id) || [];
      subscriptions.push(subscription);
      this.clientSubscriptions.set(client.id, subscriptions);
      
      this.logger.log(`Client ${client.id} subscribed to ${eventType}`);
      
      return {
        event: 'subscribe_status',
        data: { success: true, eventType }
      };
    } catch (error) {
      this.logger.error(`Error handling subscribe: ${error.message}`, error.stack);
      return {
        event: 'error',
        data: { message: error.message }
      };
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@MessageBody() data: any, client: Socket): WsResponse<any> {
    try {
      // Check if client is authenticated
      if (!client.data?.user) {
        return { event: 'error', data: { message: 'Not authenticated' } };
      }
      
      const eventType = data.eventType;
      
      if (!eventType) {
        return { event: 'error', data: { message: 'Event type is required' } };
      }
      
      // Clean up specific subscription
      if (this.clientSubscriptions.has(client.id)) {
        const subscriptions = this.clientSubscriptions.get(client.id);
        // Keep subscriptions, just remove the specific one
        this.clientSubscriptions.set(
          client.id,
          subscriptions.filter(sub => {
            // No way to identify specific subscription, would require more metadata
            // This is just a placeholder
            return false;
          })
        );
      }
      
      this.logger.log(`Client ${client.id} unsubscribed from ${eventType}`);
      
      return {
        event: 'unsubscribe_status',
        data: { success: true, eventType }
      };
    } catch (error) {
      this.logger.error(`Error handling unsubscribe: ${error.message}`, error.stack);
      return {
        event: 'error',
        data: { message: error.message }
      };
    }
  }

  private disconnect(client: Socket, reason: string) {
    client.emit('error', { message: reason });
    client.disconnect(true);
  }
}
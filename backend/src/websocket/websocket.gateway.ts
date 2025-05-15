import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/events',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private connectedClients: Map<string, { socket: Socket; user?: any }> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized', 'WebsocketGateway');
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate client using token
      const token = this.extractTokenFromHeader(client);
      
      if (token) {
        try {
          // Validate token
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('jwt.secret'),
          });
          
          // Store user info with socket
          this.connectedClients.set(client.id, { 
            socket: client,
            user: {
              id: payload.sub,
              email: payload.email,
              role: payload.role,
            }
          });
          
          // Join rooms based on user role
          client.join(`role:${payload.role}`);
          client.join(`user:${payload.sub}`);
          
          this.logger.log(`Client connected: ${client.id} (User: ${payload.email})`, 'WebsocketGateway');
        } catch (e) {
          // JWT validation failed, connect as anonymous
          this.connectedClients.set(client.id, { socket: client });
          client.join('anonymous');
          
          this.logger.warn(`Client connected with invalid token: ${client.id}`, 'WebsocketGateway');
        }
      } else {
        // No token, connect as anonymous
        this.connectedClients.set(client.id, { socket: client });
        client.join('anonymous');
        
        this.logger.log(`Anonymous client connected: ${client.id}`, 'WebsocketGateway');
      }
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`, error.stack, 'WebsocketGateway');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove client from connected clients
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`, 'WebsocketGateway');
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() topic: string,
  ) {
    // Subscribe client to a specific topic
    client.join(topic);
    this.logger.log(`Client ${client.id} subscribed to topic: ${topic}`, 'WebsocketGateway');
    return { success: true, topic };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() topic: string,
  ) {
    // Unsubscribe client from a specific topic
    client.leave(topic);
    this.logger.log(`Client ${client.id} unsubscribed from topic: ${topic}`, 'WebsocketGateway');
    return { success: true, topic };
  }

  // Broadcast to all connected clients
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Broadcast to clients subscribed to a specific topic
  broadcastToTopic(topic: string, event: string, data: any) {
    this.server.to(topic).emit(event, data);
  }

  // Broadcast to clients with specific role
  broadcastToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Broadcast to specific user
  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Broadcast an alert to clients
  broadcastAlert(alert: any) {
    this.broadcastToAll('alert', alert);
    this.logger.log(`Broadcasting alert to all clients: ${alert.id}`, 'WebsocketGateway');
  }

  // Broadcast an event to clients
  broadcastEvent(event: any) {
    this.broadcastToAll('event', event);
    this.logger.log(`Broadcasting event to all clients: ${event.id}`, 'WebsocketGateway');
  }

  // Broadcast a notification to clients
  broadcastNotification(notification: any) {
    // Broadcast to all by default
    this.broadcastToAll('notification', notification);
    
    // If notification is targeted to specific user, also send directly
    if (notification.userId) {
      this.broadcastToUser(notification.userId, 'notification', notification);
    }
    
    this.logger.log(`Broadcasting notification to clients: ${notification.title}`, 'WebsocketGateway');
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Helper method to extract token from socket handshake
  private extractTokenFromHeader(client: Socket): string | undefined {
    const { auth } = client.handshake;
    if (auth && auth.token) {
      return auth.token;
    }
    
    // Try getting from headers
    const authorization = client.handshake.headers.authorization;
    if (authorization && authorization.split(' ')[0] === 'Bearer') {
      return authorization.split(' ')[1];
    }
    
    return undefined;
  }
}
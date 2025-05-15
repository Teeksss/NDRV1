import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new WsException('Unauthorized access - Missing token');
    }

    try {
      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user to client data for future use
      client.data.user = payload;
      return true;
    } catch (error) {
      this.logger.error(`WS Authentication failed: ${error.message}`);
      throw new WsException('Unauthorized access - Invalid token');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // Check auth field in handshake
    if (client.handshake.auth && client.handshake.auth.token) {
      return client.handshake.auth.token;
    }

    // Check headers
    if (client.handshake.headers.authorization) {
      const authHeader = client.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    return null;
  }
}
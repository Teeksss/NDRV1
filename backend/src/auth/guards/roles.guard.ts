import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private logger: LoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    // Get user from request
    const { user } = context.switchToHttp().getRequest();
    
    // If no user (should not happen after JwtAuthGuard), deny access
    if (!user) {
      this.logger.warn('RolesGuard: No user found in request', 'RolesGuard');
      return false;
    }
    
    // Check if user role matches required roles
    const hasRole = requiredRoles.includes(user.role);
    
    if (!hasRole) {
      const request = context.switchToHttp().getRequest();
      this.logger.warn(
        `User ${user.email} (role: ${user.role}) was denied access to ${request.method} ${request.path} - required roles: ${requiredRoles.join(', ')}`,
        'RolesGuard'
      );
    }
    
    return hasRole;
  }
}
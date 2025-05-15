import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        this.logger.warn(`JWT validation failed: User with ID ${payload.sub} not found`, 'JwtStrategy');
        throw new UnauthorizedException();
      }
      
      if (!user.isActive) {
        this.logger.warn(`JWT validation failed: User ${user.email} is inactive`, 'JwtStrategy');
        throw new UnauthorizedException('User account is inactive');
      }
      
      // Check if the token was issued before the user's password was changed
      if (user.passwordChangedAt) {
        const passwordChangedAt = user.passwordChangedAt.getTime() / 1000;
        if (payload.iat < passwordChangedAt) {
          this.logger.warn(`JWT validation failed: Token was issued before password change for user ${user.email}`, 'JwtStrategy');
          throw new UnauthorizedException('Password has been changed, please login again');
        }
      }
      
      // Return user object which will be attached to the request
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`, error.stack, 'JwtStrategy');
      throw new UnauthorizedException();
    }
  }
}
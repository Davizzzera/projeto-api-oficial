import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SessionValidationService } from '../../modules/identity/auth/session-validation.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessionValidationService: SessionValidationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    
    try {
      const { authPrincipal, authSessionKey } = await this.sessionValidationService.validateSession(request);
      request.auth = authPrincipal;
      request.authSessionKey = authSessionKey;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid session');
    }
  }
}

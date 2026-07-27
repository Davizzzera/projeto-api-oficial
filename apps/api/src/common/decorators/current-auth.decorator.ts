import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthPrincipal } from '../types/auth-principal';

export const CurrentAuth = createParamDecorator(
  (data: keyof AuthPrincipal | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const auth = request.auth;

    if (!auth) {
      throw new InternalServerErrorException('CurrentAuth decorator used without SessionGuard');
    }

    return data ? auth[data] : auth;
  }
);

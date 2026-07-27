import 'fastify';
import { AuthPrincipal } from './auth-principal';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthPrincipal;
    authSessionKey?: string;
  }
}

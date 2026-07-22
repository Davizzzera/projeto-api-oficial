import { Controller, Get, Post, Req, Res, Headers, Body, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RedisRateLimiterService } from '../../../infrastructure/redis/redis-rate-limiter.service';
import { LoginInputSchema } from '@repo/contracts';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimiter: RedisRateLimiterService
  ) {}

  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  async getCsrf(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    res.header('Cache-Control', 'no-store');
    
    // Check if there is an active session
    const sessionCookie = req.cookies.session_id;
    if (sessionCookie) {
      const unsignedSession = req.unsignCookie(sessionCookie);
      if (unsignedSession.valid && unsignedSession.value) {
        const sessionData = await this.authService.getSession(unsignedSession.value);
        if (sessionData) {
          // Authenticated CSRF token
          const token = this.authService.generateCsrfToken(sessionData.csrfSecret, 'auth:logout');
          return { csrfToken: token };
        }
      }
    }
    
    // Pre-login CSRF token
    const nonce = await this.authService.generatePreAuthNonce();
    
    res.setCookie('preauth_session', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      signed: true,
      maxAge: 10 * 60, // 10 minutes
    });

    return { csrfToken: nonce };
  }

  @Post('login')
  @HttpCode(HttpStatus.NO_CONTENT)
  async login(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Headers('x-csrf-token') csrfToken?: string,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
    @Headers('user-agent') userAgentRaw?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    const ip = (process.env.NODE_ENV === 'production' && forwardedFor ? forwardedFor.split(',')[0] : req.ip) || 'unknown';
    
    const ipAllowed = await this.rateLimiter.checkLimit('ip', ip, 50, 15 * 60);
    if (!ipAllowed) {
      res.status(HttpStatus.TOO_MANY_REQUESTS);
      return;
    }

    const preauthSession = req.cookies.preauth_session;
    if (!preauthSession) {
      throw new ForbiddenException('Missing pre-login session');
    }

    const unsignedPreauth = req.unsignCookie(preauthSession);
    if (!unsignedPreauth.valid || !unsignedPreauth.value) {
      throw new ForbiddenException('Invalid pre-login session signature');
    }

    if (!csrfToken || unsignedPreauth.value !== csrfToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const allowedOrigin = process.env.APP_URL;
    if (origin && allowedOrigin && !origin.startsWith(allowedOrigin)) {
      throw new ForbiddenException('Invalid Origin');
    }
    if (!origin && referer && allowedOrigin && !referer.startsWith(allowedOrigin)) {
      throw new ForbiddenException('Invalid Referer');
    }

    const isValidNonce = await this.authService.consumePreAuthNonce(unsignedPreauth.value);
    if (!isValidNonce) {
      throw new ForbiddenException('CSRF token already used or expired');
    }

    res.clearCookie('preauth_session', { path: '/' });

    const parsedBody = LoginInputSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new UnauthorizedException('Invalid credentials format');
    }

    const { email, password } = parsedBody.data;

    const emailAllowed = await this.rateLimiter.checkLimit('email', email, 10, 15 * 60);
    if (!emailAllowed) {
      res.status(HttpStatus.TOO_MANY_REQUESTS);
      return;
    }

    const authData = await this.authService.validateCredentials(email, password);
    if (!authData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userAgent = (userAgentRaw || 'unknown').substring(0, 256);

    const { sessionId, maxAge } = await this.authService.createSession(
      authData.userId,
      authData.membershipId,
      authData.organizationId,
      authData.sessionVersion,
      userAgent
    );

    res.setCookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      signed: true,
      maxAge: maxAge,
    });

    return;
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    res.header('Cache-Control', 'no-store');

    const sessionCookie = req.cookies.session_id;
    if (!sessionCookie) {
      throw new UnauthorizedException('No session');
    }

    const unsignedSession = req.unsignCookie(sessionCookie);
    if (!unsignedSession.valid || !unsignedSession.value) {
      throw new UnauthorizedException('Invalid session signature');
    }

    const sessionData = await this.authService.getSession(unsignedSession.value);
    if (!sessionData) {
      res.clearCookie('session_id', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      throw new UnauthorizedException('Session expired or invalid');
    }
    
    const meData = await this.authService.getMeData(sessionData);
    if (!meData) {
      // Invalidate session if DB state doesn't match
      await this.authService.destroySession(unsignedSession.value);
      res.clearCookie('session_id', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      throw new UnauthorizedException('Session data is no longer valid');
    }

    return meData;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: FastifyRequest, 
    @Res({ passthrough: true }) res: FastifyReply,
    @Headers('x-csrf-token') csrfToken?: string
  ) {
    const sessionCookie = req.cookies.session_id;
    if (sessionCookie) {
      const unsignedSession = req.unsignCookie(sessionCookie);
      if (unsignedSession.valid && unsignedSession.value) {
        const sessionData = await this.authService.getSession(unsignedSession.value);
        
        if (!sessionData || !csrfToken || !this.authService.verifyCsrfToken(sessionData.csrfSecret, 'auth:logout', csrfToken)) {
          throw new ForbiddenException('Invalid CSRF token for logout');
        }

        await this.authService.destroySession(unsignedSession.value);
      }
    } else {
      throw new ForbiddenException('Invalid CSRF token for logout');
    }

    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return;
  }
}

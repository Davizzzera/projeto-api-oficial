import { Controller, Get, Post, Req, Res, Headers, Body, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RedisRateLimiterService } from '../../../infrastructure/redis/redis-rate-limiter.service';
import { LoginInputSchema, AuthCsrfActionSchema, SwitchOrganizationInputSchema } from '@repo/contracts';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CurrentAuth } from '../../../common/decorators/current-auth.decorator';
import { AuthPrincipal } from '../../../common/types/auth-principal';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimiter: RedisRateLimiterService
  ) {}

  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  async getCsrf(
    @Req() req: FastifyRequest, 
    @Res({ passthrough: true }) res: FastifyReply,
    @Query('action') actionQuery?: string
  ) {
    res.header('Cache-Control', 'no-store');
    
    // Check if there is an active session
    const sessionCookie = req.cookies.session_id;
    if (sessionCookie) {
      const unsignedSession = req.unsignCookie(sessionCookie);
      if (unsignedSession.valid && unsignedSession.value) {
        const sessionData = await this.authService.getSession(unsignedSession.value);
        if (sessionData) {
          const parseResult = AuthCsrfActionSchema.safeParse(actionQuery);
          if (!parseResult.success) {
            throw new BadRequestException('Invalid CSRF action');
          }
          const action = parseResult.data;

          // Authenticated CSRF token
          const token = this.authService.generateCsrfToken(sessionData.csrfSecret, action);
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

  @Get('organizations')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async getOrganizations(@CurrentAuth() auth: AuthPrincipal) {
    return this.authService.getUserOrganizations(auth.userId, auth.organizationId);
  }

  @Post('switch-organization')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async switchOrganization(
    @CurrentAuth() auth: AuthPrincipal,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Headers('x-csrf-token') csrfToken?: string
  ) {
    if (!req.authSessionKey) {
      throw new ForbiddenException('Invalid session');
    }

    // Validate CSRF for switch-organization action
    const sessionData = await this.authService.getSessionByKey(req.authSessionKey);
    if (!sessionData || !csrfToken || !this.authService.verifyCsrfToken(sessionData.csrfSecret, 'auth:switch-organization', csrfToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    // Validate body
    const parsedBody = SwitchOrganizationInputSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new BadRequestException('Invalid request body');
    }

    const { organizationId: targetOrgId } = parsedBody.data;

    // Reject switching to the same org
    if (targetOrgId === auth.organizationId) {
      throw new BadRequestException('Already in the target organization');
    }

    // Perform session rotation
    const result = await this.authService.switchOrganization(
      req.authSessionKey,
      targetOrgId,
      auth.userId,
      auth.sessionVersion
    );

    if (!result) {
      throw new ForbiddenException('No active membership in the target organization');
    }

    // Set the new rotated cookie
    res.setCookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      signed: true,
      maxAge: result.maxAge,
    });

    return;
  }

  @Get('me')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async me(@CurrentAuth() auth: AuthPrincipal, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    res.header('Cache-Control', 'no-store');

    const meData = await this.authService.getMeData(auth);
    if (!meData) {
      // Invalidate session if DB state doesn't match
      if (req.authSessionKey) {
        await this.authService.destroySessionByKey(req.authSessionKey);
      }
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
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: FastifyRequest, 
    @Res({ passthrough: true }) res: FastifyReply,
    @Headers('x-csrf-token') csrfToken?: string
  ) {
    if (req.authSessionKey) {
      const sessionData = await this.authService.getSessionByKey(req.authSessionKey);
      
      if (!sessionData || !csrfToken || !this.authService.verifyCsrfToken(sessionData.csrfSecret, 'auth:logout', csrfToken)) {
        throw new ForbiddenException('Invalid CSRF token for logout');
      }

      await this.authService.destroySessionByKey(req.authSessionKey);
    } else {
      throw new ForbiddenException('Invalid session');
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

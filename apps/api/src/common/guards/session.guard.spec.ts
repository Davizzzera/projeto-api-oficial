import { SessionGuard } from './session.guard';
import { SessionValidationService } from '../../modules/identity/auth/session-validation.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { vi } from 'vitest';

describe('SessionGuard', () => {
  let guard: SessionGuard;
  let mockSessionValidationService: any;

  beforeEach(() => {
    mockSessionValidationService = {
      validateSession: vi.fn(),
    } as any;
    guard = new SessionGuard(mockSessionValidationService);
  });

  it('should allow access and populate request on valid session', async () => {
    const mockAuthPrincipal = { userId: '123' } as any;
    mockSessionValidationService.validateSession.mockResolvedValue({
      authPrincipal: mockAuthPrincipal,
      authSessionKey: 'session:hash'
    });

    const mockRequest = {} as FastifyRequest;
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest
      })
    } as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    
    expect(result).toBe(true);
    expect(mockRequest.auth).toBe(mockAuthPrincipal);
    expect(mockRequest.authSessionKey).toBe('session:hash');
  });

  it('should propagate UnauthorizedException from service', async () => {
    mockSessionValidationService.validateSession.mockRejectedValue(new UnauthorizedException('test'));

    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({}) })
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException on general error', async () => {
    mockSessionValidationService.validateSession.mockRejectedValue(new Error('general'));

    const mockContext = {
      switchToHttp: () => ({ getRequest: () => ({}) })
    } as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });
});

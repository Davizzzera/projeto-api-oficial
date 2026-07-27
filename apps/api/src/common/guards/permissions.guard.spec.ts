import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { vi } from 'vitest';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as any;
    guard = new PermissionsGuard(reflector);
  });

  it('should allow if no metadata is set', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw UnauthorizedException if auth is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['org:read']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({} as FastifyRequest)
      })
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });

  it('should allow if all permissions are present', () => {
    reflector.getAllAndOverride.mockReturnValue(['org:read']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          auth: { permissions: ['org:read', 'org:write'] }
        })
      })
    } as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw ForbiddenException if one permission is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(['org:read', 'org:write']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          auth: { permissions: ['org:read'] }
        })
      })
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException for SUPER_ADMIN without tenant permissions', () => {
    reflector.getAllAndOverride.mockReturnValue(['org:read']);
    const mockContext = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          auth: { platformRole: 'SUPER_ADMIN', permissions: [] }
        })
      })
    } as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});

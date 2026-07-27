import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisSessionRepository } from './redis-session.repository';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { ConflictException } from '@nestjs/common';
import { RedisSession } from '../schemas/redis-session.schema';

describe('RedisSessionRepository', () => {
  let repository: RedisSessionRepository;
  let redisService: any;

  beforeEach(() => {
    redisService = {
      get: vi.fn(),
      del: vi.fn(),
      eval: vi.fn(),
      multi: vi.fn(),
      options: { keyPrefix: 'test:' }
    };
    repository = new RedisSessionRepository(redisService as any);
  });

  describe('rotateSession', () => {
    it('deve retornar null se a sessão antiga não existir', async () => {
      vi.spyOn(redisService, 'get').mockResolvedValue(null);

      const result = await repository.rotateSession('old-key', 'mem-1', 'org-1', 1);

      expect(result).toBeNull();
      expect(redisService.eval).not.toHaveBeenCalled();
    });

    it('deve rotacionar com sucesso usando script Lua atômico', async () => {
      const now = new Date();
      const absExp = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // +1h
      const userId = '00000000-0000-0000-0000-000000000001';
      const oldMemId = '00000000-0000-0000-0000-000000000002';
      const oldOrgId = '00000000-0000-0000-0000-000000000003';
      const newMemId = '00000000-0000-0000-0000-000000000004';
      const newOrgId = '00000000-0000-0000-0000-000000000005';

      const oldSession: RedisSession = {
        userId: userId,
        membershipId: oldMemId,
        organizationId: oldOrgId,
        sessionVersion: 1,
        createdAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        absoluteExpiresAt: absExp,
        userAgent: 'test',
        csrfSecret: 'old-secret',
      };

      vi.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(oldSession));
      vi.spyOn(redisService, 'eval').mockResolvedValue(1);

      const result = await repository.rotateSession('old-key', newMemId, newOrgId, 2);

      expect(result).not.toBeNull();
      expect(result?.newSessionId).toBeDefined();
      expect(result?.newTtl).toBe(1800); // 30 mins
      expect(redisService.eval).toHaveBeenCalledWith(
        expect.any(String), // LUA script
        2, // keys count
        'old-key',
        expect.stringContaining('session:'),
        '1800',
        expect.any(String) // new session payload
      );
      
      const newSessionPayloadStr = redisService.eval.mock.calls[0][5];
      const newSessionPayload = JSON.parse(newSessionPayloadStr);
      expect(newSessionPayload.userId).toBe(userId);
      expect(newSessionPayload.organizationId).toBe(newOrgId);
      expect(newSessionPayload.membershipId).toBe(newMemId);
      expect(newSessionPayload.csrfSecret).not.toBe('old-secret');
      expect(newSessionPayload.absoluteExpiresAt).toBe(absExp);
      expect(newSessionPayload.sessionVersion).toBe(2);
    });

    it('deve limitar TTL pela expiração absoluta se for menor que o idle timeout', async () => {
      const now = new Date();
      const absExp = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // +10m
      const userId = '00000000-0000-0000-0000-000000000001';
      const oldMemId = '00000000-0000-0000-0000-000000000002';
      const oldOrgId = '00000000-0000-0000-0000-000000000003';
      const newMemId = '00000000-0000-0000-0000-000000000004';
      const newOrgId = '00000000-0000-0000-0000-000000000005';

      const oldSession = {
        userId: userId,
        membershipId: oldMemId,
        organizationId: oldOrgId,
        sessionVersion: 1,
        createdAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        absoluteExpiresAt: absExp,
        userAgent: 'test',
        csrfSecret: 'old-secret',
      };

      vi.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(oldSession));
      vi.spyOn(redisService, 'eval').mockResolvedValue(1);

      const result = await repository.rotateSession('old-key', newMemId, newOrgId, 1);

      expect(result?.newTtl).toBeGreaterThanOrEqual(599);
      expect(result?.newTtl).toBeLessThanOrEqual(600);
    });

    it('deve lançar ConflictException se transação Lua falhar (retornar 0)', async () => {
      const now = new Date();
      const absExp = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const userId = '00000000-0000-0000-0000-000000000001';
      const oldMemId = '00000000-0000-0000-0000-000000000002';
      const oldOrgId = '00000000-0000-0000-0000-000000000003';
      const newMemId = '00000000-0000-0000-0000-000000000004';
      const newOrgId = '00000000-0000-0000-0000-000000000005';

      const oldSession = {
        userId: userId,
        membershipId: oldMemId,
        organizationId: oldOrgId,
        sessionVersion: 1,
        createdAt: now.toISOString(),
        lastActivityAt: now.toISOString(),
        absoluteExpiresAt: absExp,
        userAgent: 'test',
        csrfSecret: 'old-secret',
      };

      vi.spyOn(redisService, 'get').mockResolvedValue(JSON.stringify(oldSession));
      vi.spyOn(redisService, 'eval').mockResolvedValue(0);

      await expect(
        repository.rotateSession('old-key', newMemId, newOrgId, 1)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('rollbackRotation', () => {
    it('deve restaurar sessão antiga e deletar a nova', async () => {
      const multiMock = {
        del: vi.fn().mockReturnThis(),
        setex: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([ [null, 1], [null, 'OK'] ]),
      };
      vi.spyOn(redisService, 'multi').mockReturnValue(multiMock as any);

      await repository.rollbackRotation('old-key', 'new-key', '{"data":"old"}', 1800);

      expect(multiMock.del).toHaveBeenCalledWith('new-key');
      expect(multiMock.setex).toHaveBeenCalledWith('old-key', 1800, '{"data":"old"}');
    });
  });
});


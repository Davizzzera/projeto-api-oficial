import { describe, it, expect, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

describe('GlobalExceptionFilter', () => {
  const filter = new GlobalExceptionFilter();

  type MockResponse = { status: any };

  function createMockHost(overrides: { id?: string } = {}): ArgumentsHost {
    const mockSend = vi.fn();
    const mockStatus = vi.fn().mockReturnValue({ send: mockSend });
    const mockRequest = { id: overrides.id || 'test-correlation-id' };
    const mockResponse: MockResponse = { status: mockStatus };

    const mockHttpArgsHost = {
      getRequest: () => mockRequest as any,
      getResponse: () => mockResponse as any,
    };

    const mockArgsHost = {
      switchToHttp: () => mockHttpArgsHost as any,
    };

    return mockArgsHost as ArgumentsHost;
  }

  it('should handle HttpException and return proper status', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const host = createMockHost();

    filter.catch(exception, host);

    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<MockResponse>();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should return 500 for unknown exceptions', () => {
    const exception = new Error('Something went wrong');
    const host = createMockHost();

    filter.catch(exception, host);

    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<MockResponse>();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('should include correlationId from request', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const host = createMockHost({ id: 'my-correlation-id' });

    filter.catch(exception, host);

    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<MockResponse>();
    const sendFn = response.status(0).send;
    const sentBody = sendFn.mock.calls[0][0];
    expect(sentBody.correlationId).toBe('my-correlation-id');
  });

  it('should not expose stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const exception = new Error('Internal failure');
    const host = createMockHost();

    filter.catch(exception, host);

    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<MockResponse>();
    const sendFn = response.status(0).send;
    const sentBody = sendFn.mock.calls[0][0];

    expect(sentBody.error).toBeUndefined();
    expect(sentBody.message).toBe('Internal server error');
    expect(sentBody).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });

  it('should never include DATABASE_URL or REDIS_URL in response', () => {
    const exception = new Error('Connection failed: postgresql://user:pass@host/db');
    const host = createMockHost();

    filter.catch(exception, host);

    const httpCtx = host.switchToHttp();
    const response = httpCtx.getResponse<MockResponse>();
    const sendFn = response.status(0).send;
    const sentBody = sendFn.mock.calls[0][0];

    const bodyStr = JSON.stringify(sentBody);
    expect(bodyStr).not.toContain('DATABASE_URL');
    expect(bodyStr).not.toContain('REDIS_URL');
  });
});

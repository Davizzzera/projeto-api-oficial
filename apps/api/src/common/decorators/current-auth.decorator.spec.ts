import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentAuth } from './current-auth.decorator';

function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() value: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentAuth Decorator', () => {
  let factory: Function;

  beforeEach(() => {
    factory = getParamDecoratorFactory(CurrentAuth);
  });

  it('should return the full auth principal', () => {
    const mockAuthPrincipal = { userId: '123', permissions: [] };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ auth: mockAuthPrincipal })
      })
    } as ExecutionContext;

    const result = factory(undefined, mockContext);
    expect(result).toBe(mockAuthPrincipal);
  });

  it('should return a specific property of the auth principal', () => {
    const mockAuthPrincipal = { userId: '123', organizationId: 'org1' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ auth: mockAuthPrincipal })
      })
    } as ExecutionContext;

    const result = factory('organizationId', mockContext);
    expect(result).toBe('org1');
  });

  it('should throw InternalServerErrorException if auth is undefined', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({})
      })
    } as ExecutionContext;

    expect(() => factory(undefined, mockContext)).toThrow(InternalServerErrorException);
  });
});

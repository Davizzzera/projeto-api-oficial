import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupOpenApi } from './config/openapi.config';
import { ConfigService } from '@nestjs/config';

import fastifyCookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  await app.register(fastifyCookie as any, {
    secret: configService.get<string>('SESSION_COOKIE_SECRET'),
  });

  setupOpenApi(app, configService);

  const port = configService.get<number>('API_PORT') || 3333;
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on http://localhost:${port}`);
}
bootstrap();

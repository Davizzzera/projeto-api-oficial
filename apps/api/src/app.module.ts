import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.config';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { ensureCorrelationId, loggerConfig } from '@repo/observability';
import { v4 as uuidv4 } from 'uuid';

import { AuthModule } from './modules/identity/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        redact: loggerConfig.redact,
        genReqId: (req) => {
          const correlationId = req.headers['x-correlation-id'] || req.headers['correlation-id'];
          return ensureCorrelationId(correlationId);
        },
        customProps: (req, res) => {
          return {
            correlation_id: req.id,
            request_id: uuidv4(),
          };
        },
      },
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}

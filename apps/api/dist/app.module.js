"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nestjs_pino_1 = require("nestjs-pino");
const env_config_1 = require("./config/env.config");
const health_module_1 = require("./health/health.module");
const database_module_1 = require("./infrastructure/database/database.module");
const redis_module_1 = require("./infrastructure/redis/redis.module");
const observability_1 = require("@repo/observability");
const uuid_1 = require("uuid");
const auth_module_1 = require("./modules/identity/auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '../../.env',
                validate: env_config_1.validateEnv,
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    redact: observability_1.loggerConfig.redact,
                    genReqId: (req) => {
                        const correlationId = req.headers['x-correlation-id'] || req.headers['correlation-id'];
                        return (0, observability_1.ensureCorrelationId)(correlationId);
                    },
                    customProps: (req, res) => {
                        return {
                            correlation_id: req.id,
                            request_id: (0, uuid_1.v4)(),
                        };
                    },
                },
            }),
            database_module_1.DatabaseModule,
            redis_module_1.RedisModule,
            health_module_1.HealthModule,
            auth_module_1.AuthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
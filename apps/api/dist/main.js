"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const nestjs_pino_1 = require("nestjs-pino");
const app_module_1 = require("./app.module");
const openapi_config_1 = require("./config/openapi.config");
const config_1 = require("@nestjs/config");
const cookie_1 = require("@fastify/cookie");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: false }), { bufferLogs: true });
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    const configService = app.get(config_1.ConfigService);
    await app.register(cookie_1.default, {
        secret: configService.get('SESSION_COOKIE_SECRET'),
    });
    (0, openapi_config_1.setupOpenApi)(app, configService);
    const port = configService.get('API_PORT') || 3333;
    await app.listen(port, '0.0.0.0');
    logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map
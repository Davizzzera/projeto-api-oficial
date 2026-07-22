"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupOpenApi = setupOpenApi;
const swagger_1 = require("@nestjs/swagger");
function setupOpenApi(app, configService) {
    const env = configService.get('NODE_ENV');
    if (env === 'production') {
        return;
    }
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Nexus API')
        .setDescription('API do backend do Nexus (WhatsApp SaaS)')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
}
//# sourceMappingURL=openapi.config.js.map
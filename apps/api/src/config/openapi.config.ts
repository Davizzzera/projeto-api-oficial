import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupOpenApi(app: INestApplication, configService: ConfigService) {
  const env = configService.get<string>('NODE_ENV');
  
  if (env === 'production') {
    return; // Não expor Swagger em produção
  }

  const config = new DocumentBuilder()
    .setTitle('Nexus API')
    .setDescription('API do backend do Nexus (WhatsApp SaaS)')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

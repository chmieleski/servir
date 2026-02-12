import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppConfigService } from './app/modules/config';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  const apiPrefix = appConfig.getApiPrefix();
  const apiDocsPath = appConfig.getApiDocsPath();
  const appVersion = appConfig.getAppVersion();
  const port = appConfig.getPort();

  app.setGlobalPrefix(apiPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Servir API')
    .setDescription('Servir enterprise API')
    .setVersion(appVersion)
    .build();
  const openApi = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(apiDocsPath, app, cleanupOpenApiDoc(openApi));

  await app.listen(port);
  Logger.log(`Application is running on: ${appConfig.getAppUrl()}`);
}

bootstrap().catch((error: unknown) => {
  Logger.error(error);
  process.exit(1);
});

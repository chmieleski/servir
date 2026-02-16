import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppConfigService } from './modules/config';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  const host = appConfig.getHost();
  const apiPrefix = appConfig.getApiPrefix();
  const apiDocsEnabled = appConfig.isApiDocsEnabled();
  const apiDocsPath = appConfig.getApiDocsPath();
  const appVersion = appConfig.getAppVersion();
  const port = appConfig.getPort();

  if (appConfig.isCorsEnabled()) {
    app.enableCors({
      origin: appConfig.getCorsOrigin(),
    });
  }

  if (apiPrefix.length > 0) {
    app.setGlobalPrefix(apiPrefix);
  }

  if (apiDocsEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Servir API')
      .setDescription('Servir enterprise API')
      .setVersion(appVersion)
      .build();
    const openApi = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(apiDocsPath, app, cleanupOpenApiDoc(openApi));
  }

  await app.listen(port, host);
  Logger.log(`Application is running on: ${appConfig.getAppUrl(host)}`);

  if (apiDocsEnabled) {
    Logger.log(`Swagger UI is running on: ${appConfig.getApiDocsUrl(host)}`);
  }
}

bootstrap().catch((error: unknown) => {
  Logger.error(error);
  process.exit(1);
});

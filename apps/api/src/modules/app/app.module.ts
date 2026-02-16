import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodExceptionFilter } from '@servir/core';
import { HealthModule } from '@servir/feature-health';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppConfigModule } from '../config';

@Module({
  imports: [AppConfigModule, HealthModule],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
  ],
})
export class AppModule {}

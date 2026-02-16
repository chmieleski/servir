import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CoreBillingModule } from '@servir/core-billing';
import { HttpExceptionEnvelopeFilter, ZodExceptionFilter } from '@servir/core';
import { CoreAuthModule } from '@servir/core-auth';
import { FeatureAccessModule } from '@servir/feature-access';
import { FeatureBillingModule } from '@servir/feature-billing';
import { HealthModule } from '@servir/feature-health';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AppConfigModule } from '../config';

@Module({
  imports: [
    AppConfigModule,
    CoreAuthModule,
    CoreBillingModule,
    FeatureAccessModule,
    FeatureBillingModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionEnvelopeFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
  ],
})
export class AppModule {}

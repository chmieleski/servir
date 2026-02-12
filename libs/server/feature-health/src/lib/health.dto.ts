import { HealthQuerySchema, HealthResponseSchema } from '@servir/contracts';
import { createZodDto } from 'nestjs-zod';

export class HealthQueryDto extends createZodDto(HealthQuerySchema) {}

export class HealthResponseDto extends createZodDto(HealthResponseSchema) {}

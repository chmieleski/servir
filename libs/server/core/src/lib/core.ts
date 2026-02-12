import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ApiErrorSchema } from '@servir/contracts';
import {
  ZodSerializationException,
  ZodValidationException,
} from 'nestjs-zod';
import { ZodError } from 'zod';

type ZodException = ZodValidationException | ZodSerializationException;

function toApiIssues(exception: ZodException) {
  const zodError = exception.getZodError();

  if (!(zodError instanceof ZodError)) {
    return [];
  }

  return zodError.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
    code: issue.code,
  }));
}

@Catch(ZodValidationException, ZodSerializationException)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void };
    }>();
    const request = context.getRequest<{ url?: string }>();
    const isValidation = exception instanceof ZodValidationException;
    const status = isValidation
      ? HttpStatus.BAD_REQUEST
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = ApiErrorSchema.parse({
      error: {
        code: isValidation ? 'VALIDATION_ERROR' : 'SERIALIZATION_ERROR',
        message: isValidation ? 'Request validation failed' : 'Response serialization failed',
        issues: toApiIssues(exception),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url ?? 'unknown',
      },
    });

    response.status(status).json(payload);
  }
}

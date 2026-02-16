import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiErrorCodeSchema,
  ApiErrorIssueSchema,
  ApiErrorSchema,
  type ApiErrorCode,
  type ApiErrorIssue,
} from '@servir/contracts';
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

export type ApiHttpExceptionOptions = {
  status: number;
  code: ApiErrorCode;
  message: string;
  issues?: ApiErrorIssue[];
};

export class ApiHttpException extends HttpException {
  constructor(options: ApiHttpExceptionOptions) {
    super(
      {
        code: options.code,
        message: options.message,
        issues: options.issues ?? [],
      },
      options.status,
    );
  }
}

@Catch(HttpException)
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (statusCode: number) => { json: (body: unknown) => void };
    }>();
    const request = context.getRequest<{ url?: string }>();
    const status = exception.getStatus();

    const { code, message, issues } = this.extractErrorData(exception, status);
    const payload = ApiErrorSchema.parse({
      error: {
        code,
        message,
        issues,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url ?? 'unknown',
      },
    });

    response.status(status).json(payload);
  }

  private extractErrorData(exception: HttpException, status: number) {
    const responsePayload = exception.getResponse();
    let code = this.mapStatusToCode(status);
    let message = exception.message;
    let issues: ApiErrorIssue[] = [];

    if (typeof responsePayload === 'string') {
      message = responsePayload;
      return { code, message, issues };
    }

    if (!responsePayload || typeof responsePayload !== 'object') {
      return { code, message, issues };
    }

    const record = responsePayload as Record<string, unknown>;
    const messageField = record.message;
    if (typeof messageField === 'string' && messageField.length > 0) {
      message = messageField;
    } else if (Array.isArray(messageField) && messageField.length > 0) {
      message = messageField.join(', ');
    }

    const codeField = record.code;
    if (ApiErrorCodeSchema.safeParse(codeField).success) {
      code = codeField as ApiErrorCode;
    }

    const issuesField = record.issues;
    const parsedIssues = ApiErrorIssueSchema.array().safeParse(issuesField);
    if (parsedIssues.success) {
      issues = parsedIssues.data;
    }

    return { code, message, issues };
  }

  private mapStatusToCode(status: number): ApiErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}

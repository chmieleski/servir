import { HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { ZodExceptionFilter } from './core.js';

describe('ZodExceptionFilter', () => {
  it('should map zod validation errors to a standardized envelope', () => {
    const filter = new ZodExceptionFilter();
    const statusSpy = vi.fn().mockReturnThis();
    const jsonSpy = vi.fn();
    statusSpy.mockReturnValue({ json: jsonSpy });

    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/api/v1/health?format=invalid' }),
        getResponse: () => ({ status: statusSpy }),
      }),
    };

    const exception = new ZodValidationException(
      z.object({ format: z.enum(['full', 'minimal']) }).safeParse({ format: 'bad' }).error,
    );

    filter.catch(exception, host as never);

    expect(statusSpy).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });
});

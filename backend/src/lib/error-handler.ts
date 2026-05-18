import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Structured logger with timestamps for consistent error tracking.
 */
const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    const entry = {
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    };
    console.error(JSON.stringify(entry));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const entry = {
      level: 'warn',
      timestamp: new Date().toISOString(),
      message,
      ...meta,
    };
    console.warn(JSON.stringify(entry));
  },
};

/**
 * Creates a standardized error response object.
 *
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 * @returns Consistent error response: { error: { message, code, details? } }
 */
export function createErrorResponse(
  message: string,
  status: number,
  details?: unknown
) {
  const response: { error: { message: string; code: number; details?: unknown } } = {
    error: {
      message,
      code: status,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  return response;
}

/**
 * Checks if an error is a Prisma/database-related error.
 *
 * @param error - Unknown error to check
 * @returns true if the error is a Prisma client error
 */
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) return true;
  if (error instanceof Prisma.PrismaClientUnknownRequestError) return true;
  if (error instanceof Prisma.PrismaClientRustPanicError) return true;
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientValidationError) return true;
  return false;
}

/**
 * Checks if an error is a Zod validation error.
 *
 * @param error - Unknown error to check
 * @returns true if the error is a ZodError
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ZodError;
}

/**
 * Safely parses a JSON string, returning a fallback value on failure.
 *
 * @param str - JSON string to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T = unknown>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Handles API errors by classifying them and returning appropriate responses.
 *
 * @param error - Caught error (unknown type)
 * @param context - Route and method information for logging
 * @returns Response object with consistent error format and HTTP status
 */
export function handleApiError(
  error: unknown,
  context: { route: string; method: string }
): { response: ReturnType<typeof createErrorResponse>; status: number } {
  logger.error(`Error in ${context.method} ${context.route}`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (isValidationError(error)) {
    const zodError = error as ZodError;
    return {
      status: 400,
      response: createErrorResponse(
        'Validation failed',
        400,
        zodError.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      ),
    };
  }

  if (isDatabaseError(error)) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;

    if ('code' in prismaError && typeof prismaError.code === 'string') {
      const codeMap: Record<string, { status: number; message: string }> = {
        P2002: { status: 409, message: 'Unique constraint violation' },
        P2003: { status: 400, message: 'Foreign key constraint violation' },
        P2025: { status: 404, message: 'Record not found' },
        P2014: { status: 400, message: 'Relation violation' },
      };

      const mapped = codeMap[prismaError.code];
      if (mapped) {
        return {
          status: mapped.status,
          response: createErrorResponse(mapped.message, mapped.status, {
            code: prismaError.code,
          }),
        };
      }
    }

    return {
      status: 500,
      response: createErrorResponse(
        'Database operation failed',
        500,
        process.env.NODE_ENV === 'development'
          ? { detail: (error as Error).message }
          : undefined
      ),
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      response: createErrorResponse('Invalid request format', 400),
    };
  }

  if (error instanceof Error) {
    const status =
      'status' in error && typeof (error as { status: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 500;

    return {
      status,
      response: createErrorResponse(
        error.message || 'Internal server error',
        status,
        process.env.NODE_ENV === 'development'
          ? { stack: error.stack }
          : undefined
      ),
    };
  }

  return {
    status: 500,
    response: createErrorResponse('Internal server error', 500),
  };
}

type Request = globalThis.Request;
type Response = globalThis.Response;

/**
 * Wraps an API route handler with automatic error handling.
 * Catches unhandled errors and returns a formatted error response.
 *
 * @param handler - Async function that handles the request
 * @returns Wrapped handler that catches and formats errors
 *
 * @example
 * export const GET = withErrorHandling(async (req) => {
 *   const data = await prisma.user.findMany();
 *   return Response.json(data);
 * });
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      const route = new URL(req.url).pathname;
      const { response, status } = handleApiError(error, {
        route,
        method: req.method,
      });
      return new Response(JSON.stringify(response), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

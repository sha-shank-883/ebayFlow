import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface LoggerOptions {
  service: string;
  level?: LogLevel;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

const RESET_COLOR = '\x1b[0m';

const isDevelopment = process.env.NODE_ENV !== 'production';

function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function formatConsoleOutput(entry: LogEntry): string {
  const color = LEVEL_COLORS[entry.level];
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const parts = [
    `${color}[${entry.level.toUpperCase()}]${RESET_COLOR}`,
    `${timestamp}`,
    `[${entry.service}]`,
  ];

  if (entry.correlationId) {
    parts.push(`\x1b[90m[${entry.correlationId.slice(0, 8)}]\x1b[0m`);
  }

  parts.push(entry.message);

  if (entry.metadata) {
    parts.push(`\x1b[90m${JSON.stringify(entry.metadata)}\x1b[0m`);
  }

  return parts.join(' ');
}

/**
 * Structured logger with JSON output, correlation ID support, and color-coded console output.
 */
export class Logger {
  private service: string;
  private level: LogLevel;
  private correlationId?: string;
  private logFile?: string;

  constructor(options: LoggerOptions, correlationId?: string) {
    this.service = options.service;
    this.level = options.level ?? 'debug';
    this.correlationId = correlationId;
    this.logFile = process.env.LOG_FILE;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  private buildEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
    };

    if (metadata && Object.keys(metadata).length > 0) {
      entry.metadata = metadata;
    }

    if (this.correlationId) {
      entry.correlationId = this.correlationId;
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    if (isDevelopment) {
      const consoleMethod = entry.level === 'error'
        ? console.error
        : entry.level === 'warn'
          ? console.warn
          : entry.level === 'debug'
            ? console.debug
            : console.log;

      consoleMethod(formatConsoleOutput(entry));
    } else {
      const formatted = formatLogEntry(entry);
      if (entry.level === 'error') {
        console.error(formatted);
      } else if (entry.level === 'warn') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }

      if (this.logFile) {
        this.writeToFile(formatted);
      }
    }
  }

  private writeToFile(line: string): void {
    try {
      const fs = require('fs');
      const path = require('path');

      const dir = path.dirname(this.logFile!);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(this.logFile!, line + '\n');
    } catch {
      console.error('Failed to write to log file:', this.logFile);
    }
  }

  /**
   * Log a debug message.
   * @param message - The log message
   * @param metadata - Optional metadata object
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.buildEntry('debug', message, metadata));
  }

  /**
   * Log an info message.
   * @param message - The log message
   * @param metadata - Optional metadata object
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.buildEntry('info', message, metadata));
  }

  /**
   * Log a warning message.
   * @param message - The log message
   * @param metadata - Optional metadata object
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.buildEntry('warn', message, metadata));
  }

  /**
   * Log an error message.
   * @param message - The log message
   * @param metadata - Optional metadata object
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.output(this.buildEntry('error', message, metadata));
  }

  /**
   * Create a child logger with a correlation ID.
   * @param correlationId - The correlation ID for request tracing
   */
  child(correlationId: string): Logger {
    return new Logger({ service: this.service, level: this.level }, correlationId);
  }
}

/**
 * Default singleton logger instance.
 */
export const logger = new Logger({
  service: process.env.SERVICE_NAME ?? 'sellerflow-ai',
  level: (process.env.LOG_LEVEL as LogLevel) ?? 'info',
});

/**
 * Create a logger instance with a correlation ID for request tracing.
 * @param correlationId - The correlation ID to attach to all log entries
 * @returns A new Logger instance with the correlation ID set
 */
export function createRequestLogger(correlationId: string): Logger {
  return logger.child(correlationId);
}

/**
 * Middleware wrapper that adds a correlation ID to incoming requests.
 * Generates a new correlation ID if not present in headers.
 * Attaches the request logger to the request object.
 *
 * @param handler - The request handler function
 * @returns A wrapped handler with request logging
 *
 * @example
 * ```ts
 * const app = express();
 * app.use(withRequestLogging(async (req, res) => {
 *   const reqLogger = (req as any).logger;
 *   reqLogger.info('Processing request');
 *   res.send('OK');
 * }));
 * ```
 */
export function withRequestLogging<TRequest extends { headers: Record<string, string | string[] | undefined>; [key: string]: unknown }, TResponse>(
  handler: (req: TRequest & { logger: Logger; correlationId: string }, res: TResponse) => Promise<void> | void,
) {
  return async (req: TRequest, res: TResponse): Promise<void> => {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? randomUUID();

    const reqLogger = createRequestLogger(correlationId);
    (req as TRequest & { logger: Logger; correlationId: string }).logger = reqLogger;
    (req as TRequest & { logger: Logger; correlationId: string }).correlationId = correlationId;

    reqLogger.debug('Request started', {
      method: (req as Record<string, unknown>).method,
      url: (req as Record<string, unknown>).url,
    });

    try {
      await handler(req as TRequest & { logger: Logger; correlationId: string }, res);
    } catch (error) {
      reqLogger.error('Request failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };
}

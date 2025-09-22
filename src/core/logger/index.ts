import pino from 'pino';
import { config } from '../config/index.js';

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: config.logLevel,
  base: {
    env: config.env,
    locale: config.locale,
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Development transport with pretty printing
const devTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss.SSS',
    ignore: 'pid,hostname',
    messageFormat: '{module} | {msg}',
    errorLikeObjectKeys: ['err', 'error'],
  },
};

// Create the main logger
export const logger = pino({
  ...baseConfig,
  transport: config.env === 'development' ? devTransport : undefined,
});

// Factory for child loggers with module context
export function createLogger(module: string) {
  return logger.child({ module });
}

// Specialized loggers for common operations
export const loggers = {
  db: createLogger('db'),
  health: createLogger('health'),
  watchdog: createLogger('watchdog'),
  email: createLogger('email'),
  ai: createLogger('ai'),
  pipeline: createLogger('pipeline'),
  api: createLogger('api'),
};

// Helper for structured error logging
export function logError(logger: pino.Logger, error: unknown, message: string, context?: Record<string, unknown>) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error({ 
    err, 
    errorMessage: err.message,
    errorStack: err.stack,
    ...context 
  }, message);
}

// Helper for performance logging
export function logPerformance(logger: pino.Logger, operation: string, durationMs: number, meta?: Record<string, unknown>) {
  const level = durationMs > 1000 ? 'warn' : 'debug';
  logger[level]({
    operation,
    durationMs,
    durationSec: (durationMs / 1000).toFixed(2),
    ...meta,
  }, `${operation} completed in ${durationMs}ms`);
}
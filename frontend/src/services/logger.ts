type LottoLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LottoLogOptions {
  message?: string;
  payload?: unknown;
  error?: unknown;
  level?: LottoLogLevel;
}

interface ScopedLogger {
  debug(event: string, options?: Omit<LottoLogOptions, 'level'>): void;
  info(event: string, options?: Omit<LottoLogOptions, 'level'>): void;
  warn(event: string, options?: Omit<LottoLogOptions, 'level'>): void;
  error(event: string, options?: Omit<LottoLogOptions, 'level'>): void;
  event(event: string, options?: LottoLogOptions): void;
}

const PREFIX = '[Lotto645]';

function sanitizeFragment(fragment: string): string {
  return fragment.replace(/^\[+|]+$/g, '').trim();
}

function getConsoleMethod(level: LottoLogLevel): (...args: unknown[]) => void {
  switch (level) {
    case 'debug':
      return console.debug.bind(console);
    case 'info':
      return console.info.bind(console);
    case 'warn':
      return console.warn.bind(console);
    case 'error':
    default:
      return console.error.bind(console);
  }
}

function normalizeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return error;
}

function buildDetails(options?: LottoLogOptions): Record<string, unknown> | undefined {
  if (!options) {
    return undefined;
  }

  const details: Record<string, unknown> = {};

  if (options.message) {
    details.message = options.message;
  }

  if (options.payload !== undefined) {
    details.payload = options.payload;
  }

  if (options.error !== undefined) {
    details.error = normalizeError(options.error);
  }

  if (Object.keys(details).length === 0) {
    return undefined;
  }

  details.timestamp = new Date().toISOString();

  return details;
}

function printLog(scope: string, event: string, options?: LottoLogOptions): void {
  const level = options?.level ?? 'info';
  const method = getConsoleMethod(level);
  const normalizedScope = sanitizeFragment(scope);
  const normalizedEvent = sanitizeFragment(event);
  const prefix = `${PREFIX}[${normalizedScope}${normalizedEvent ? `:${normalizedEvent}` : ''}]`;
  const details = buildDetails(options);

  if (details) {
    method(prefix, details);
  } else {
    method(prefix);
  }
}

export const logger = {
  event(scope: string, event: string, options?: LottoLogOptions): void {
    printLog(scope, event, options);
  },
  debug(scope: string, event: string, options?: Omit<LottoLogOptions, 'level'>): void {
    printLog(scope, event, { ...options, level: 'debug' });
  },
  info(scope: string, event: string, options?: Omit<LottoLogOptions, 'level'>): void {
    printLog(scope, event, { ...options, level: 'info' });
  },
  warn(scope: string, event: string, options?: Omit<LottoLogOptions, 'level'>): void {
    printLog(scope, event, { ...options, level: 'warn' });
  },
  error(scope: string, event: string, options?: Omit<LottoLogOptions, 'level'>): void {
    printLog(scope, event, { ...options, level: 'error' });
  },
  scoped(scope: string): ScopedLogger {
    const sanitizedScope = sanitizeFragment(scope);
    return {
      debug(event, options) {
        printLog(sanitizedScope, event, { ...options, level: 'debug' });
      },
      info(event, options) {
        printLog(sanitizedScope, event, { ...options, level: 'info' });
      },
      warn(event, options) {
        printLog(sanitizedScope, event, { ...options, level: 'warn' });
      },
      error(event, options) {
        printLog(sanitizedScope, event, { ...options, level: 'error' });
      },
      event(event, options) {
        printLog(sanitizedScope, event, options);
      }
    };
  }
};

export type { LottoLogLevel, LottoLogOptions, ScopedLogger };

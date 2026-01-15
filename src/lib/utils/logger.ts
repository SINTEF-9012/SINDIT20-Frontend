/**
 * Log levels for structured logging
 */
export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error'
}

/**
 * Structured logger interface
 */
interface Logger {
	debug(message: string, context?: Record<string, unknown>): void;
	info(message: string, context?: Record<string, unknown>): void;
	warn(message: string, context?: Record<string, unknown>): void;
	error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void;
}

/**
 * Format log message with context
 */
function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): string {
	const timestamp = new Date().toISOString();
	const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
	return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Console logger implementation
 */
class ConsoleLogger implements Logger {
	debug(message: string, context?: Record<string, unknown>): void {
		console.debug(formatLog(LogLevel.DEBUG, message, context));
	}

	info(message: string, context?: Record<string, unknown>): void {
		console.info(formatLog(LogLevel.INFO, message, context));
	}

	warn(message: string, context?: Record<string, unknown>): void {
		console.warn(formatLog(LogLevel.WARN, message, context));
	}

	error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
		const errorContext = {
			...context,
			error: error instanceof Error ? {
				name: error.name,
				message: error.message,
				stack: error.stack
			} : error
		};
		console.error(formatLog(LogLevel.ERROR, message, errorContext));
	}
}

/**
 * Get the default logger instance
 */
export function getLogger(): Logger {
	return new ConsoleLogger();
}

/**
 * Default logger instance
 */
export const logger = getLogger();

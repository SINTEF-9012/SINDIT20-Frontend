/**
 * Custom error classes for the SINDIT frontend application.
 * These provide better error handling and type safety throughout the app.
 */

/**
 * Base error class for all SINDIT errors
 */
export class SinditError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Error thrown when API requests fail
 */
export class ApiError extends SinditError {
	constructor(
		message: string,
		public readonly statusCode?: number,
		public readonly endpoint?: string,
		details?: unknown
	) {
		super(message, 'API_ERROR', details);
	}
}

/**
 * Error thrown when authentication fails
 */
export class AuthError extends SinditError {
	constructor(message: string, details?: unknown) {
		super(message, 'AUTH_ERROR', details);
	}
}

/**
 * Error thrown when data validation fails
 */
export class ValidationError extends SinditError {
	constructor(
		message: string,
		public readonly field?: string,
		details?: unknown
	) {
		super(message, 'VALIDATION_ERROR', details);
	}
}

/**
 * Error thrown when required configuration is missing
 */
export class ConfigError extends SinditError {
	constructor(
		message: string,
		public readonly configKey?: string
	) {
		super(message, 'CONFIG_ERROR', { configKey });
	}
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends SinditError {
	constructor(message: string, details?: unknown) {
		super(message, 'NETWORK_ERROR', details);
	}
}

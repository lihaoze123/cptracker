/**
 * Error types for the application.
 * These types eliminate the need for type assertions throughout the codebase.
 */

/**
 * Database-related errors from IndexedDB or Supabase
 */
export class DatabaseError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

/**
 * Validation errors for form inputs and user data
 */
export class ValidationError extends Error {
  readonly field: string;
  readonly value?: unknown;

  constructor(message: string, field: string, value?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Network-related errors for API calls
 */
export class NetworkError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

/**
 * Union type of all application errors
 */
export type AppError = DatabaseError | ValidationError | NetworkError;

/**
 * Supabase-specific error type
 */
export interface SupabaseError {
  message: string;
  code: string;
  details?: string;
  hint?: string;
}

/**
 * Type guard for Supabase errors
 * Replaces: (error as { code?: string }).code
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error
  );
}

/**
 * Type guard for DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

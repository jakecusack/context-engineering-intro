/**
 * API-specific types for responses and error handling
 */

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface OperationResult {
  success: boolean;
  affectedRows?: number;
  insertId?: number;
  error?: string;
}

export class PRPServerError extends Error {
  public code: string;
  public statusCode: number;
  public details?: Record<string, any>;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PRPServerError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // PRP parsing errors
  PRP_PARSING_FAILED: 'PRP_PARSING_FAILED',
  ANTHROPIC_API_ERROR: 'ANTHROPIC_API_ERROR',
  INVALID_PRP_CONTENT: 'INVALID_PRP_CONTENT',
  
  // Task management errors
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  INVALID_TASK_STATUS: 'INVALID_TASK_STATUS',
  DEPENDENCY_CYCLE: 'DEPENDENCY_CYCLE',
  
  // Documentation errors
  DOCUMENTATION_NOT_FOUND: 'DOCUMENTATION_NOT_FOUND',
  INVALID_DOC_TYPE: 'INVALID_DOC_TYPE',
  
  // Tag errors
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  TAG_ALREADY_EXISTS: 'TAG_ALREADY_EXISTS',
  TAG_IN_USE: 'TAG_IN_USE'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
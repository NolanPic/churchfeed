/**
 * Upload type
 */
export type UploadType = "post" | "message" | "avatar";

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  GIF_NOT_ALLOWED_FOR_AVATAR = "GIF_NOT_ALLOWED_FOR_AVATAR",
  FILE_EXTENSION_MISMATCH = "FILE_EXTENSION_MISMATCH",
}

/**
 * Validation error object
 */
export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

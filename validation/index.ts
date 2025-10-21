/**
 * File validation module for upload validation
 *
 * This module provides shared validation logic for file uploads
 * that can be used on both the frontend and backend.
 */

export { validateFile, getFileExtension } from "./validator";
export {
  UploadType,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from "./types";
export { VALIDATION_OPTIONS } from "./config";

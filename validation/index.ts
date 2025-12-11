/**
 * Validation module for file uploads and form fields
 *
 * This module provides shared validation logic
 * that can be used on both the frontend and backend.
 */

// File validation
export { validateFile, getFileExtension } from "./fileValidator";
export { VALIDATION_OPTIONS } from "./config";

// Form validation
export {
  validateTextField,
  validateEmailField,
  validateNumberField,
  validateSelectField,
} from "./formValidator";
export type {
  TextFieldValidationOptions,
  SelectFieldValidationOptions,
} from "./formValidator";

// Shared types
export type {
  UploadType,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from "./types";

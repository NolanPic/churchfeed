import {
  ValidationError,
  ValidationResult,
  ValidationErrorCode,
} from "./types";

/**
 * Validation options for text fields
 */
export interface TextFieldValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  patternMessage?: string;
}

/**
 * Validation options for select fields
 */
export interface SelectFieldValidationOptions {
  required?: boolean;
}

/**
 * Email validation regex (simple but covers most cases)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a text field value
 *
 * @param value - The value to validate
 * @param options - Validation options
 * @param fieldName - Optional field name for better error messages (defaults to "This field")
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = validateTextField("John", {
 *   required: true,
 *   minLength: 4,
 *   maxLength: 25
 * }, "Name");
 *
 * if (!result.valid) {
 *   result.errors.forEach(error => console.error(error.message));
 * }
 * ```
 */
export function validateTextField(
  value: string,
  options: TextFieldValidationOptions,
  fieldName: string = "This field"
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required validation
  if (options.required && !value.trim()) {
    errors.push({
      code: ValidationErrorCode.REQUIRED,
      message: `${fieldName} is required`,
    });
    // If required validation fails, don't check other validations
    return { valid: false, errors };
  }

  // Skip other validations if field is empty and not required
  if (!value.trim()) {
    return { valid: true, errors: [] };
  }

  // Min length validation
  if (options.minLength !== undefined && value.length < options.minLength) {
    errors.push({
      code: ValidationErrorCode.MIN_LENGTH,
      message: `${fieldName} must be at least ${options.minLength} character${options.minLength === 1 ? "" : "s"}`,
    });
  }

  // Max length validation
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    errors.push({
      code: ValidationErrorCode.MAX_LENGTH,
      message: `${fieldName} must be ${options.maxLength} character${options.maxLength === 1 ? "" : "s"} or less`,
    });
  }

  // Pattern validation
  if (options.pattern && !options.pattern.test(value)) {
    errors.push({
      code: ValidationErrorCode.INVALID_PATTERN,
      message: options.patternMessage || `${fieldName} has an invalid format`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an email field
 *
 * @param value - The email value to validate
 * @param options - Validation options (required)
 * @param fieldName - Optional field name for better error messages (defaults to "Email")
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = validateEmailField("user@example.com", { required: true });
 * ```
 */
export function validateEmailField(
  value: string,
  options: Pick<TextFieldValidationOptions, "required">,
  fieldName: string = "Email"
): ValidationResult {
  return validateTextField(
    value,
    {
      ...options,
      pattern: EMAIL_REGEX,
      patternMessage: `${fieldName} must be a valid email address`,
    },
    fieldName
  );
}

/**
 * Validates a number field
 *
 * @param value - The value to validate (as string, since it comes from input)
 * @param options - Validation options
 * @param fieldName - Optional field name for better error messages (defaults to "This field")
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = validateNumberField("42", { required: true, min: 0, max: 100 });
 * ```
 */
export function validateNumberField(
  value: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
  },
  fieldName: string = "This field"
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required validation
  if (options.required && !value.trim()) {
    errors.push({
      code: ValidationErrorCode.REQUIRED,
      message: `${fieldName} is required`,
    });
    return { valid: false, errors };
  }

  // Skip other validations if empty and not required
  if (!value.trim()) {
    return { valid: true, errors: [] };
  }

  // Check if it's a valid number
  const numValue = Number(value);
  if (isNaN(numValue)) {
    errors.push({
      code: ValidationErrorCode.INVALID_NUMBER,
      message: `${fieldName} must be a valid number`,
    });
    return { valid: false, errors };
  }

  // Min validation
  if (options.min !== undefined && numValue < options.min) {
    errors.push({
      code: ValidationErrorCode.MIN_VALUE,
      message: `${fieldName} must be at least ${options.min}`,
    });
  }

  // Max validation
  if (options.max !== undefined && numValue > options.max) {
    errors.push({
      code: ValidationErrorCode.MAX_VALUE,
      message: `${fieldName} must be ${options.max} or less`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a select field value
 *
 * @param value - The value to validate
 * @param options - Validation options
 * @param fieldName - Optional field name for better error messages (defaults to "This field")
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = validateSelectField("", { required: true }, "Privacy");
 * ```
 */
export function validateSelectField(
  value: string | null | undefined,
  options: SelectFieldValidationOptions,
  fieldName: string = "This field"
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required validation - check for falsey values
  if (options.required && !value) {
    errors.push({
      code: ValidationErrorCode.REQUIRED,
      message: `${fieldName} is required`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

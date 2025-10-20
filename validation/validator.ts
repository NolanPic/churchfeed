import {
  UploadType,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from "./types";
import { VALIDATION_OPTIONS } from "./config";

/**
 * Rule for file type restrictions per upload type
 */
interface FileTypeRestrictionRule {
  uploadType: UploadType;
  fileType: string;
  allowed: boolean;
}

/**
 * File type restriction rules
 */
const FILE_TYPE_RESTRICTION_RULES: FileTypeRestrictionRule[] = [
  {
    uploadType: "avatar",
    fileType: "image/gif",
    allowed: false,
  },
];

/**
 * Validates file size based on upload type
 */
function validateFileSize(
  file: File,
  uploadType: UploadType
): ValidationError | null {
  const maxSize = VALIDATION_OPTIONS.sizeLimits[uploadType];

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      code: ValidationErrorCode.FILE_TOO_LARGE,
      message: `File size must be ${maxSizeMB}MB or less. Current size: ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB`,
    };
  }

  return null;
}

/**
 * Validates file type is an allowed image type
 */
function validateFileType(file: File): ValidationError | null {
  const isValidType = VALIDATION_OPTIONS.allowedImageTypes.includes(
    file.type as typeof VALIDATION_OPTIONS.allowedImageTypes[number]
  );

  if (!isValidType) {
    return {
      code: ValidationErrorCode.INVALID_FILE_TYPE,
      message: `File type "${file.type}" is not supported. Allowed types: ${VALIDATION_OPTIONS.allowedImageTypes.join(", ")}`,
    };
  }

  return null;
}

/**
 * Validates file type restrictions based on upload type
 */
function validateFileTypeRestrictions(
  file: File,
  uploadType: UploadType,
  rules: FileTypeRestrictionRule[]
): ValidationError | null {
  for (const rule of rules) {
    if (rule.uploadType === uploadType && rule.fileType === file.type) {
      if (!rule.allowed) {
        return {
          code: ValidationErrorCode.GIF_NOT_ALLOWED_FOR_AVATAR,
          message: `${file.type} files are not allowed for ${uploadType}s`,
        };
      }
    }
  }

  return null;
}

/**
 * Main validation function that validates a file for upload
 *
 * @param file - The file to validate
 * @param uploadType - The type of upload (post, message, or avatar)
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = await validateFile(file, "avatar");
 * if (!result.valid) {
 *   result.errors.forEach(error => {
 *     console.error(error.message);
 *   });
 * }
 * ```
 */
export async function validateFile(
  file: File,
  uploadType: UploadType
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Run all validations
  const validations = [
    validateFileType(file),
    validateFileSize(file, uploadType),
    validateFileTypeRestrictions(file, uploadType, FILE_TYPE_RESTRICTION_RULES),
  ];

  // Collect errors from all validations
  for (const error of validations) {
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

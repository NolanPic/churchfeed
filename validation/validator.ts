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
 * MIME type to file extension mapping
 */
const MIME_TO_EXTENSION: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/heic": ["heic"],
  "image/heif": ["heif"],
};

/**
 * Extracts file extension from filename
 */
function getFileExtension(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fileName.length - 1) {
    return null;
  }
  return fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Validates file size based on upload type
 */
function validateFileSize(
  blob: Blob,
  uploadType: UploadType
): ValidationError | null {
  const maxSize = VALIDATION_OPTIONS.sizeLimits[uploadType];

  if (blob.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      code: ValidationErrorCode.FILE_TOO_LARGE,
      message: `File size must be ${maxSizeMB}MB or less. Current size: ${(
        blob.size /
        (1024 * 1024)
      ).toFixed(2)}MB`,
    };
  }

  return null;
}

/**
 * Validates file type is an allowed image type
 */
function validateFileType(blob: Blob): ValidationError | null {
  const isValidType = VALIDATION_OPTIONS.allowedImageTypes.includes(
    blob.type as typeof VALIDATION_OPTIONS.allowedImageTypes[number]
  );

  if (!isValidType) {
    return {
      code: ValidationErrorCode.INVALID_FILE_TYPE,
      message: `File type "${blob.type}" is not supported. Allowed types: ${VALIDATION_OPTIONS.allowedImageTypes.join(", ")}`,
    };
  }

  return null;
}

/**
 * Validates file extension matches MIME type
 */
function validateFileExtension(
  blob: Blob,
  fileName: string
): ValidationError | null {
  const extension = getFileExtension(fileName);

  if (!extension) {
    return {
      code: ValidationErrorCode.FILE_EXTENSION_MISMATCH,
      message: `File must have a valid extension`,
    };
  }

  const expectedExtensions = MIME_TO_EXTENSION[blob.type];
  if (!expectedExtensions || !expectedExtensions.includes(extension)) {
    return {
      code: ValidationErrorCode.FILE_EXTENSION_MISMATCH,
      message: `File extension "${extension}" does not match MIME type "${blob.type}". Expected: ${expectedExtensions?.join(", ") || "unknown"}`,
    };
  }

  return null;
}

/**
 * Validates file type restrictions based on upload type
 */
function validateFileTypeRestrictions(
  blob: Blob,
  uploadType: UploadType,
  rules: FileTypeRestrictionRule[]
): ValidationError | null {
  for (const rule of rules) {
    if (rule.uploadType === uploadType && rule.fileType === blob.type) {
      if (!rule.allowed) {
        return {
          code: ValidationErrorCode.GIF_NOT_ALLOWED_FOR_AVATAR,
          message: `${blob.type} files are not allowed for ${uploadType}s`,
        };
      }
    }
  }

  return null;
}

/**
 * Main validation function that validates a file for upload
 *
 * @param blob - The file blob to validate
 * @param fileName - The name of the file (for extension validation)
 * @param uploadType - The type of upload (post, message, or avatar)
 * @returns ValidationResult with valid flag and any errors
 *
 * @example
 * ```ts
 * const result = validateFile(blob, "photo.jpg", "avatar");
 * if (!result.valid) {
 *   result.errors.forEach(error => {
 *     console.error(error.message);
 *   });
 * }
 * ```
 */
export function validateFile(
  blob: Blob,
  fileName: string,
  uploadType: UploadType
): ValidationResult {
  const errors: ValidationError[] = [];

  // Run all validations
  const validations = [
    validateFileType(blob),
    validateFileSize(blob, uploadType),
    validateFileExtension(blob, fileName),
    validateFileTypeRestrictions(blob, uploadType, FILE_TYPE_RESTRICTION_RULES),
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

/**
 * Extracts file extension from filename (utility export)
 */
export { getFileExtension };

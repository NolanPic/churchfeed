import { UploadType } from "./types";

/**
 * Allowed MIME types for image uploads
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

/**
 * Size limits in bytes
 */
const SIZE_LIMITS = {
  avatar: 1 * 1024 * 1024, // 1MB
  thread: 3 * 1024 * 1024, // 3MB
  message: 3 * 1024 * 1024, // 3MB
} as const;

/**
 * Validation options configuration
 */
export const VALIDATION_OPTIONS = {
  allowedImageTypes: ALLOWED_IMAGE_TYPES,
  sizeLimits: SIZE_LIMITS,
  /**
   * GIFs are not allowed for avatars
   */
  gifNotAllowedFor: ["avatar"] as UploadType[],
} as const;

"use client";

import { useState, useCallback, useContext } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "../../../context/OrganizationProvider";
import { CurrentFeedAndPostContext } from "../../../context/CurrentFeedAndPostProvider";
import { Id } from "@/convex/_generated/dataModel";

export interface UseImageUploadReturn {
  /**
   * Final Convex storage URL (null until upload completes)
   */
  imageUrl: string | null;
  /**
   * Data URL for immediate preview (null until file selected)
   */
  previewUrl: string | null;
  isUploading: boolean;
  error: Error | null;
  /**
   * Upload an image file
   * @param file - The image file to upload
   */
  uploadImage: (file: File) => Promise<void>;
}

/**
 * Reusable hook for uploading images to Convex storage.
 *
 * This hook provides core image upload functionality that can be used
 * anywhere in the app (avatars, profile images, editor images, etc.).
 *
 * @returns Object with imageUrl, previewUrl, isUploading, error, and uploadImage function
 *
 * @example
 * ```tsx
 * const { imageUrl, previewUrl, isUploading, error, uploadImage } = useImageUpload();
 *
 * const handleFileSelect = async (file: File) => {
 *   await uploadImage(file);
 * };
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateUploadUrlForUserContent = useMutation(
    api.uploads.generateUploadUrlForUserContent
  );
  const getStorageUrlForUserContent = useMutation(
    api.uploads.getStorageUrlForUserContent
  );

  const org = useOrganization();
  const { feedId, postId } = useContext(CurrentFeedAndPostContext);

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);

        // Validate context
        const orgId = org?._id as Id<"organizations"> | undefined;
        if (!orgId) {
          throw new Error("No organization found. Please ensure you're logged in.");
        }
        if (!feedId) {
          throw new Error("No feed found. Please select a feed.");
        }

        // Create data URL for immediate visual feedback
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreviewUrl(dataUrl);

        // Start upload process
        const postUrl = await generateUploadUrlForUserContent({
          orgId,
          feedId,
          postId,
        });

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();

        const storageUrl = await getStorageUrlForUserContent({
          orgId: orgId,
          storageId,
        });

        if (!storageUrl) {
          throw new Error("Failed to retrieve storage URL for uploaded image");
        }

        setImageUrl(storageUrl);
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [
      generateUploadUrlForUserContent,
      getStorageUrlForUserContent,
      feedId,
      org,
      postId,
    ]
  );

  return {
    imageUrl,
    previewUrl,
    isUploading,
    error,
    uploadImage,
  };
}

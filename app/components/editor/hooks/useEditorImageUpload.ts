"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useImageUpload } from "./useImageUpload";

export interface UseEditorImageUploadReturn {
  /**
   * Upload an image file and insert it into the editor at the current cursor position
   * @param file - The image file to upload
   */
  uploadImage: (file: File) => Promise<void>;
  error: Error | null;
}

/**
 * Editor-specific hook for uploading images and inserting them into a TipTap editor.
 *
 * This hook wraps the core useImageUpload hook and adds editor-specific logic
 * for inserting placeholder images and replacing them with final URLs.
 *
 * @param editor - TipTap editor instance
 * @returns Object with uploadImage function and error state
 *
 * @example
 * ```tsx
 * const { uploadImage, error } = useEditorImageUpload(editor);
 *
 * const handleFileSelect = async (file: File) => {
 *   await uploadImage(file);
 * };
 *
 * if (error) {
 *   console.error("Upload failed:", error);
 * }
 * ```
 */
export function useEditorImageUpload(
  editor: Editor | null
): UseEditorImageUploadReturn {
  const { previewUrl, imageUrl, uploadImage: baseUploadImage, error: uploadError } = useImageUpload();
  const currentUploadDataUrl = useRef<string | null>(null);
  const error = uploadError;

  // Insert placeholder image when preview URL is available
  useEffect(() => {
    if (!editor || !previewUrl) return;

    const { state } = editor;
    const insertPos = state.selection.from;

    // Insert placeholder image with data URL
    const imageType = state.schema.nodes.image;
    if (!imageType) {
      console.error("Image node type not found in editor schema");
      return;
    }

    const placeholderNode = imageType.create({
      src: previewUrl,
    });

    const tr = state.tr.insert(insertPos, placeholderNode);
    editor.view.dispatch(tr);

    // Store this data URL so we can find it later
    currentUploadDataUrl.current = previewUrl;
  }, [editor, previewUrl]);

  // Replace placeholder with final image when upload completes
  useEffect(() => {
    if (!editor || !imageUrl || !currentUploadDataUrl.current) return;

    const dataUrl = currentUploadDataUrl.current;
    const currentState = editor.state;
    let targetPos: number | null = null;
    let targetNodeSize: number | null = null;

    currentState.doc.descendants((node, pos) => {
      if (
        node.type.name === "image" &&
        node.attrs.src === dataUrl
      ) {
        targetPos = pos;
        targetNodeSize = node.nodeSize;
        return false; // Stop searching
      }
      return true; // Continue searching
    });

    const imageType = currentState.schema.nodes.image;
    if (!imageType) {
      console.error("Image node type not found in editor schema");
      return;
    }

    if (targetPos !== null && targetNodeSize !== null) {
      const finalImageNode = imageType.create({ src: imageUrl });
      const replaceTr = currentState.tr.replaceWith(
        targetPos,
        targetPos + targetNodeSize,
        finalImageNode
      );
      editor.view.dispatch(replaceTr);
    } else {
      // Fallback: if we can't find the placeholder, insert at the end
      const fallbackTr = currentState.tr.insert(
        currentState.doc.content.size,
        imageType.create({ src: imageUrl })
      );
      editor.view.dispatch(fallbackTr);
    }

    // Clear the ref after replacement
    currentUploadDataUrl.current = null;
  }, [editor, imageUrl]);

  const uploadImage = useCallback(
    async (file: File) => {
      // Check if editor is available
      if (!editor) {
        throw new Error("Editor is not ready");
      }

      // Trigger the base upload
      await baseUploadImage(file);
    },
    [editor, baseUploadImage]
  );

  return {
    uploadImage,
    error
  };
}

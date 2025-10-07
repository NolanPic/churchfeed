"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useEffect, useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import styles from "./ImageDrop.module.css";
import Icon from "../common/Icon";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthedUser } from "../../hooks/useAuthedUser";
import { CurrentFeedAndPostContext } from "../../context/CurrentFeedAndPostProvider";
import { Id } from "@/convex/_generated/dataModel";
import { dequeueDroppedFile } from "./uploadQueue";

const ImageDrop = (props: NodeViewProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const generateUploadUrlForUserContent = useMutation(
    api.uploads.generateUploadUrlForUserContent
  );

  // If the node was inserted by a global drop, there will be a queued file.
  // Start processing it automatically on mount.
  useEffect(() => {
    const queued = dequeueDroppedFile();
    if (queued) {
      handleDrop([queued]);
    }
    // Only run on mount; handleDrop is stable due to useCallback deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStorageUrlForUserContent = useMutation(
    api.uploads.getStorageUrlForUserContent
  );

  const { editor } = props;
  const opts = props.extension.options as ImageDropOptions;
  const placeholderId: string | null =
    (props.node?.attrs as { id?: string } | undefined)?.id ?? null;

  const user = useAuthedUser();
  const { feedId, postId } = useContext(CurrentFeedAndPostContext);

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const fromQueue = dequeueDroppedFile();
      if (!fromQueue && acceptedFiles.length > 1) {
        setHasError("Only one image can be uploaded at a time");
        return;
      }
      const file = fromQueue ?? acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setHasError(null);

      try {
        const orgId = user.organization?._id as Id<"organizations"> | undefined;
        if (!orgId || !feedId) {
          throw new Error("No organization or feed found");
        }

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
          orgId: user.organization?._id as Id<"organizations">,
          storageId,
        });

        if (storageUrl) {
          // Find the placeholder node by id and replace it atomically
          const { state } = editor;
          const imageType = state.schema.nodes.image;
          if (!imageType) throw new Error("Image node type not found");

          let targetPos: number | null = null;
          let targetNodeSize: number | null = null;

          state.doc.descendants((node, pos) => {
            if (
              node.type.name === "imageDrop" &&
              (node.attrs as { id?: string }).id &&
              (node.attrs as { id?: string }).id === placeholderId
            ) {
              targetPos = pos;
              targetNodeSize = node.nodeSize;
              return false;
            }
            return true;
          });

          if (targetPos != null && targetNodeSize != null) {
            const tr = state.tr.replaceWith(
              targetPos,
              targetPos + targetNodeSize,
              imageType.create({ src: storageUrl })
            );
            editor.view.dispatch(tr);
          }
        }
      } catch (error) {
        const err = error as Error;
        setHasError(err.message || "Upload failed");
        if (opts.onError) opts.onError(err);
      } finally {
        setIsUploading(false);
      }
    },
    [
      editor,
      opts,
      generateUploadUrlForUserContent,
      getStorageUrlForUserContent,
      feedId,
      user,
      placeholderId,
      postId,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    maxFiles: 1,
    accept: opts.accept ? { [opts.accept]: [] } : undefined,
  });

  const getText = () => {
    if (isUploading) return "Uploading...";
    if (hasError) return "Upload failed";
    if (isDragActive) return "Drop the file here...";
    return (
      <>
        <p className={styles.withMouse}>
          Drop an image here, or click to choose
        </p>
        <p className={styles.withTouch}>Drop an image here, or tap to choose</p>
      </>
    );
  };

  return (
    <NodeViewWrapper as="div" {...getRootProps()} className={styles.imageDrop}>
      <input {...getInputProps()} />
      <div className={styles.imageDropInner}>
        <Icon name="image" size={20} />
        {getText()}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageDrop;

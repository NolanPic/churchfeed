"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import styles from "./ImageDrop.module.css";
import Icon from "../common/Icon";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuthedUser } from "../../hooks/useAuthedUser";
import { CurrentFeedAndPostContext } from "../../context/CurrentFeedAndPostProvider";
import { Id } from "@/convex/_generated/dataModel";

const ImageDrop = (props: NodeViewProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const generateUploadUrlForPost = useMutation(
    api.uploads.generateUploadUrlForUserContent
  );

  const getStorageUrlForUserContent = useMutation(
    api.uploads.getStorageUrlForUserContent
  );

  const { editor, deleteNode } = props;
  const opts = props.extension.options as ImageDropOptions;

  const user = useAuthedUser();
  const { feedId } = useContext(CurrentFeedAndPostContext);
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setHasError(null);

      try {
        const url = await opts.upload(file);

        editor.chain().focus().setImage({ src: url }).run();
        // TODO: after file is uploaded, clean up the blob URL
        deleteNode();

        const postUrl = await generateUploadUrlForPost({
          orgId: user.organization?._id as Id<"organizations">,
          feedId: feedId as Id<"feeds">,
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
          editor.chain().focus().setImage({ src: storageUrl }).run();
        }
      } catch (error) {
        const err = error as Error;
        setHasError(err.message || "Upload failed");
        if (opts.onError) opts.onError(err);
        setIsUploading(false);
      }
    },
    [editor, deleteNode, opts]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
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

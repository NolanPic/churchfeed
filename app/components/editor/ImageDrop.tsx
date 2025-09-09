"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import styles from "./ImageDrop.module.css";
import Icon from "../common/Icon";

const ImageDrop = (props: NodeViewProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);

  const { editor, deleteNode } = props;
  const opts = props.extension.options as ImageDropOptions;

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

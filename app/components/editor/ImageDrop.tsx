"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

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

  return (
    <NodeViewWrapper as="div" {...getRootProps()}>
      <input {...getInputProps()} />
      <div>
        {isUploading
          ? "Uploading..."
          : hasError
            ? "Upload failed"
            : isDragActive
              ? "Drop the file here..."
              : "Drop an image here, or click to choose"}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageDrop;

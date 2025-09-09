"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ImageDropNode } from "./ImageDropNode";

export interface EditorHandle {
  getJSON: () => JSONContent | null;
  focus: () => void;
  clear: () => void;
}

interface EditorProps {
  placeholder: string;
  autofocus?: boolean;
  onSubmit?: () => void;
  className?: string;
}

const handleImageUpload = async (file: File): Promise<string> => {
  return URL.createObjectURL(file);
};

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { placeholder, autofocus = false, onSubmit, className },
  ref
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder }),
      Image,
      ImageDropNode.configure({
        accept: "image/*",
        upload: handleImageUpload,
        onError: (error: Error) => {
          console.error(error);
        },
      }),
    ],
    autofocus,
    immediatelyRender: false,
  });

  useImperativeHandle(
    ref,
    () => ({
      getJSON: () => editor?.getJSON() ?? null,
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(true),
    }),
    [editor]
  );

  useEffect(() => {
    editor?.chain().focus().setImageDrop().run();

    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <EditorContent
      editor={editor}
      className={className}
      onKeyDown={(e) => {
        if (!onSubmit) return;
        const isSubmit = e.key === "Enter" && (e.metaKey || e.ctrlKey);
        if (isSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
    />
  );
});

export default Editor;

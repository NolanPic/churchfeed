"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  useEditor,
  EditorContent,
  type Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";

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

"use client";

import userContentStyles from "../shared-styles/user-content.module.css";
import classNames from "classnames";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { ImageDropNode } from "./tiptap/ImageDropNode";
import { useRegisterEditorCommands } from "../../context/EditorCommands";
import { Focus } from "@tiptap/extensions";

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
        link: {
          protocols: ["https", "http", "mailto"],
          defaultProtocol: "https",
          shouldAutoLink: (url) =>
            url.startsWith("https://") || url.startsWith("mailto:"),
          HTMLAttributes: {
            target: "_blank",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
      Image,
      ImageDropNode.configure({
        accept: "image/*",
        onError: (error: Error) => {
          console.error(error);
        },
      }),
      Focus,
    ],
    autofocus,
    immediatelyRender: false,
  });

  const registerCommands = useRegisterEditorCommands();

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
    if (!editor) {
      registerCommands(null);
      return;
    }

    registerCommands({
      focus: () => {
        editor.chain().focus().run();
      },
      addImageDrop: () => {
        editor.chain().focus().setImageDrop().run();
      },
    });

    return () => {
      registerCommands(null);
    };
  }, [editor, registerCommands]);

  return (
    <EditorContent
      editor={editor}
      className={classNames(className, userContentStyles.userContent)}
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

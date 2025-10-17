"use client";

import userContentStyles from "../shared-styles/user-content.module.css";
import classNames from "classnames";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { useRegisterEditorCommands } from "../../context/EditorCommands";
import { Focus } from "@tiptap/extensions";
import { useEditorImageUpload } from "./hooks/useEditorImageUpload";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadImageRef = useRef<((file: File) => Promise<void>) | null>(null);

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
            rel: "noopener noreferrer",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
      Image,
      Focus,
    ],
    autofocus,
    immediatelyRender: false,
    editorProps: {
      handleDrop: (view, event) => {
        // Check if the drop contains files
        if (!event.dataTransfer?.files?.length) {
          return false;
        }

        // Check if any of the files are images
        const files = Array.from(event.dataTransfer.files);
        const imageFiles = files.filter((file) =>
          file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) {
          return false;
        }

        // Prevent opening image in new tab
        event.preventDefault();

        const imageFile = imageFiles[0];

        // Get the drop position from the event
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        if (!coordinates) {
          return true; // Couldn't determine position, but we handled the event
        }

        // Move cursor to drop position, then upload the image
        const { state, dispatch } = view;
        const tr = state.tr.setSelection(
          state.selection.constructor.near(state.doc.resolve(coordinates.pos))
        );
        dispatch(tr);

        // Upload the image at the new cursor position
        if (uploadImageRef.current) {
          uploadImageRef.current(imageFile).catch((error) => {
            console.error("Drag-drop image upload failed:", error);
          });
        }

        return true; // We handled the drop
      },
    },
  });

  const { uploadImage } = useEditorImageUpload(editor);

  // Store uploadImage in ref so handleDrop can access it
  uploadImageRef.current = uploadImage;

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

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    try {
      await uploadImage(file);
    } catch (error) {
      console.error("Image upload failed:", error);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
        fileInputRef.current?.click();
      },
    });

    return () => {
      registerCommands(null);
    };
  }, [editor, registerCommands]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: "none" }}
        aria-label="Upload image"
      />
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
    </>
  );
});

export default Editor;

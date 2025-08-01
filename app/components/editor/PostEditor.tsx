"use client";

import Backdrop from "../common/Backdrop";
import styles from "./PostEditor.module.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface PostEditorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function PostEditor({ isOpen, setIsOpen }: PostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
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
      Placeholder.configure({
        placeholder: "What's happening?",
      }),
    ],
  });

  return (
    <>
      <div className={styles.postEditor} style={isOpen ? { zIndex: 2 } : {}}>
        <EditorContent editor={editor} />
      </div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

"use client";

import Backdrop from "../common/Backdrop";
import styles from "./PostEditor.module.css";
import { useRef, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import Editor, { EditorHandle } from "./Editor";
import EditorToolbar from "./EditorToolbar";
import { EditorCommandsProvider } from "../../context/EditorCommands";
import { useOnPost } from "@/app/hooks/useOnPost";

interface PostEditorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  feedId: Id<"feeds"> | null;
}

export default function PostEditor({
  isOpen,
  setIsOpen,
  feedId,
}: PostEditorProps) {
  const editorRef = useRef<EditorHandle | null>(null);
  const { state, error, onPost, savedPostId, reset } = useOnPost(
    feedId,
    editorRef,
  );

  useEffect(() => {
    if (state === "posted") {
      setIsOpen(false);
      editorRef.current?.clear();
      reset();
    }
  }, [state, setIsOpen, reset]);

  const editorInitial = {
    minHeight: 0,
    width: 0,
    opacity: 0,
  };
  const editorOpen = {
    minHeight: "var(--editor-open-min-height)",
    width: "var(--editor-open-width)",
    opacity: 1,
  };

  return (
    <>
      <motion.div
        className={styles.postEditor}
        style={isOpen ? { zIndex: 2 } : {}}
        initial={editorInitial}
        animate={editorOpen}
        exit={editorInitial}
        transition={{
          borderTopRightRadius: { duration: 0.1 },
          duration: 0.5,
          type: "spring",
          stiffness: 350,
          damping: 35,
        }}
      >
        {error && <div className={styles.error}>{error}</div>}
        <EditorCommandsProvider>
          <Editor
            ref={editorRef}
            placeholder="What's happening?"
            autofocus
            className="tiptap-editor"
            sourceId={savedPostId}
          />
          <EditorToolbar
            actionButton={{
              label: "Post",
              icon: "send",
              onClick: onPost,
              disabled: state === "posting",
            }}
          />
        </EditorCommandsProvider>
      </motion.div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

"use client";

import { useEffect } from "react";
import Backdrop from "../common/Backdrop";
import PostEditorToolbar from "./PostEditorToolbar";
import styles from "./PostEditor.module.css";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization } from "../../context/OrganizationProvider";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";

interface EditorNode {
  type: string;
  text?: string;
  content?: EditorNode[];
}

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
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPost = useMutation(api.posts.createPost);
  const org = useOrganization();

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
      Placeholder.configure({
        placeholder: "What's happening?",
      }),
    ],
    autofocus: true,
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const onPost = async (feedIdToPostTo: Id<"feeds">) => {
    setIsPosting(true);
    const postContent = editor?.getJSON();

    if (!postContent || isEditorEmpty(postContent)) {
      setError("Please add some content to your post");
      setIsPosting(false);
      return;
    }

    if (!org || !feedIdToPostTo) {
      setError("No organization or feed found");
      setIsPosting(false);
      return;
    }

    try {
      await createPost({
        orgId: org?._id,
        feedId: feedIdToPostTo,
        content: JSON.stringify(postContent),
      });
      setIsPosting(false);
      setIsOpen(false);
    } catch (error) {
      setError("Failed to create post");
      setIsPosting(false);
    }
  };

  const editorInitial = {
    minHeight: 0,
    width: 0,
    opacity: 0,
    borderTopRightRadius: "var(--editor-closed-radius)",
  };
  const editorOpen = {
    minHeight: "var(--editor-open-min-height)",
    width: "var(--editor-open-width)",
    opacity: 1,
    borderTopRightRadius: isOpen
      ? "var(--editor-open-radius)"
      : "var(--editor-closed-radius)",
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
        <EditorContent editor={editor} />
        <PostEditorToolbar
          onPost={onPost}
          isPosting={isPosting}
          feedId={feedId}
        />
      </motion.div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

function isEditorEmpty(block: EditorNode): boolean {
  if (!block || !block.type) {
    return true;
  }
  if ("text" in block) {
    return !block.text?.trim();
  }
  return block.content
    ? block.content.every((childBlock) => isEditorEmpty(childBlock))
    : true;
}

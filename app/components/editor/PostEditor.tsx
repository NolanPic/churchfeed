"use client";

import Backdrop from "../common/Backdrop";
import styles from "./PostEditor.module.css";
import toolbarStyles from "./PostEditorToolbar.module.css";
import { useState, useRef, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization } from "../../context/OrganizationProvider";
import { Id } from "../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import Editor, { EditorHandle } from "./Editor";
import EditorToolbar from "./EditorToolbar";
import { EditorCommandsProvider } from "../../context/EditorCommands";
import Select from "../common/Select";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import { isEditorEmpty } from "./editor-utils";

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
  const { feeds } = useAuthedUser();
  const [feedIdToPostTo, setFeedIdToPostTo] = useState<Id<"feeds"> | null>(
    feedId
  );

  const editorRef = useRef<EditorHandle | null>(null);

  const onPost = async (feedIdToPostTo: Id<"feeds">) => {
    setIsPosting(true);
    const postContent = editorRef.current?.getJSON() ?? null;

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
      editorRef.current?.clear();
    } catch (error) {
      console.error(error);
      setError("Failed to create post");
      setIsPosting(false);
    }
  };

  const feedOptions = useMemo(
    () =>
      feeds
        ?.map((feed) => {
          if (feed.owner || feed.memberPermissions?.includes("post")) {
            return {
              value: feed._id,
              label: feed.name,
            };
          }
          return null;
        })
        .filter((option) => option !== null) || [],
    [feeds]
  );

  const isPostingDisabled = feedOptions.length === 0;

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
        <EditorCommandsProvider>
          <Editor
            ref={editorRef}
            placeholder="What's happening?"
            autofocus
            className="tiptap-editor"
          />
          <EditorToolbar
            leftSlot={
              <Select
                options={feedOptions}
                defaultValue={feedIdToPostTo ?? undefined}
                prependToSelected="Post in: "
                placeholder={
                  isPostingDisabled ? "No feed memberships" : "Choose a feed"
                }
                className={toolbarStyles.feedSelect}
                disabled={isPostingDisabled}
                onChange={(value) => setFeedIdToPostTo(value as Id<"feeds">)}
              />
            }
            actionButton={{
              label: "Post",
              icon: "send",
              onClick: feedIdToPostTo
                ? () => onPost(feedIdToPostTo)
                : undefined,
              disabled: isPosting || isPostingDisabled,
            }}
          />
        </EditorCommandsProvider>
      </motion.div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

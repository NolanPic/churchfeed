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

    if (!postContent || !postContent.content?.[0]?.content) {
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

  return (
    <>
      <div className={styles.postEditor} style={isOpen ? { zIndex: 2 } : {}}>
        {error && <div className={styles.error}>{error}</div>}
        <EditorContent editor={editor} />
        <PostEditorToolbar
          onPost={onPost}
          isPosting={isPosting}
          feedId={feedId}
        />
      </div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

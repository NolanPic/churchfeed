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
    const content = editor?.getJSON();

    if (!org || !feedIdToPostTo) {
      return;
    }

    await createPost({
      orgId: org?._id,
      feedId: feedIdToPostTo,
      content: JSON.stringify(content),
    });
    setIsPosting(false);
    setIsOpen(false);
  };

  return (
    <>
      <div className={styles.postEditor} style={isOpen ? { zIndex: 2 } : {}}>
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

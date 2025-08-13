"use client";

import { useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "../context/OrganizationProvider";
import Editor, { EditorHandle } from "./editor/Editor";
import EditorToolbar from "./editor/EditorToolbar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./MessageEditor.module.css";

export default function MessageEditor({
  postId,
  disabledHint,
}: {
  postId: Id<"posts">;
  disabledHint?: string;
}) {
  const editorRef = useRef<EditorHandle | null>(null);
  const [isSending, setIsSending] = useState(false);
  const org = useOrganization();
  const createMessage = useMutation(api.messages.create);

  const onSend = async () => {
    const json = editorRef.current?.getJSON();
    if (!json) return;
    setIsSending(true);
    try {
      await createMessage({
        orgId: org?._id as Id<"organizations">,
        postId,
        content: JSON.stringify(json),
      });
      editorRef.current?.clear();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.messageEditor}>
      <Editor
        ref={editorRef}
        placeholder="Continue the conversation..."
        autofocus
        className="tiptap-editor"
        onSubmit={onSend}
      />
      <EditorToolbar
        actionButton={{
          className: styles.messageEditorSendButton,
          label: disabledHint ? disabledHint : "Send",
          icon: "send",
          onClick: disabledHint ? undefined : onSend,
          disabled: isSending || !!disabledHint,
        }}
      />
    </div>
  );
}

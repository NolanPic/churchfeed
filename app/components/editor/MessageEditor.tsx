"use client";

import { useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "../../context/OrganizationProvider";
import Editor, { EditorHandle } from "./Editor";
import EditorToolbar from "./EditorToolbar";
import { EditorCommandsProvider } from "../../context/EditorCommands";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import styles from "./MessageEditor.module.css";
import { isEditorEmpty } from "./editor-utils";

export default function MessageEditor({ postId }: { postId: Id<"posts"> }) {
  const editorRef = useRef<EditorHandle | null>(null);
  const [isSending, setIsSending] = useState(false);
  const org = useOrganization();
  const createMessage = useMutation(api.messages.create);

  const onSend = async () => {
    const json = editorRef.current?.getJSON();
    if (!json || isEditorEmpty(json)) return;
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
      <EditorCommandsProvider>
        <Editor
          ref={editorRef}
          placeholder="Continue the conversation..."
          className={styles.tiptapEditor}
          onSubmit={onSend}
        />
        <EditorToolbar
          className={styles.messageEditorToolbar}
          actionButton={{
            icon: "send",
            onClick: onSend,
            disabled: isSending,
          }}
        />
      </EditorCommandsProvider>
    </div>
  );
}

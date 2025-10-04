import {
  EditorCommandsProvider,
  useEditorCommands,
} from "@/app/context/EditorCommands";
import IconButton from "../../common/IconButton";
import Modal from "../../common/Modal";
import Editor, { EditorHandle } from "../Editor";
import styles from "./PostEditorPhone.module.css";
import { useOnPost } from "@/app/hooks/useOnPost";
import { Id } from "@/convex/_generated/dataModel";
import { useRef, useEffect } from "react";

interface PostEditorPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  feedId: Id<"feeds"> | null;
}

function PhoneEditorModal({ isOpen, onClose, feedId }: PostEditorPhoneProps) {
  const { addImageDrop } = useEditorCommands();
  const editorRef = useRef<EditorHandle | null>(null);
  const { state, error, onPost } = useOnPost(feedId, editorRef);

  useEffect(() => {
    if (state === "posted") {
      onClose();
      editorRef.current?.clear();
    }
  }, [state, onClose]);

  return (
    <Modal
      title="New post"
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Write a new post"
      toolbar={({ onClose }) => (
        <div className={styles.postEditorPhoneToolbar}>
          <IconButton icon="close" onClick={onClose} />
          <IconButton icon="image" onClick={addImageDrop} />
          <IconButton
            icon="send"
            onClick={onPost}
            variant="primary"
            disabled={state === "posting"}
          />
        </div>
      )}
    >
      {error && <div className={styles.error}>{error}</div>}
      <Editor
        ref={editorRef}
        placeholder="What's happening?"
        className={styles.editor}
        autofocus
      />
    </Modal>
  );
}

export default function PostEditorPhone({
  isOpen,
  onClose,
  feedId,
}: PostEditorPhoneProps) {
  return (
    <EditorCommandsProvider>
      <PhoneEditorModal isOpen={isOpen} onClose={onClose} feedId={feedId} />
    </EditorCommandsProvider>
  );
}

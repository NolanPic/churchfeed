import {
  EditorCommandsProvider,
  useEditorCommands,
} from "@/app/context/EditorCommands";
import IconButton from "../../common/IconButton";
import Modal from "../../common/Modal";
import Editor, { EditorHandle } from "../Editor";
import styles from "./PostEditorPhone.module.css";
import { useOnPublish } from "@/app/hooks/useOnPublish";
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
  const { state, error, onPublish, publishedSourceId, reset } = useOnPublish(
    "post",
    editorRef,
    feedId,
  );

  useEffect(() => {
    if (state === "published") {
      onClose();
      editorRef.current?.clear();
      reset();
    }
  }, [state, onClose, reset]);

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
            onClick={onPublish}
            variant="primary"
            disabled={state === "publishing"}
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
        sourceId={publishedSourceId}
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

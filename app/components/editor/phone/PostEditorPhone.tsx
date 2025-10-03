import { EditorCommandsProvider } from "@/app/context/EditorCommands";
import IconButton from "../../common/IconButton";
import Modal from "../../common/Modal";
import Editor from "../Editor";
import styles from "./PostEditorPhone.module.css";

interface PostEditorPhoneProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostEditorPhone({
  isOpen,
  onClose,
}: PostEditorPhoneProps) {
  return (
    <EditorCommandsProvider>
      <Modal
        title="New post"
        isOpen={isOpen}
        onClose={onClose}
        ariaLabel="Write a new post"
        toolbar={({ onClose }) => (
          <div className={styles.postEditorPhoneToolbar}>
            <IconButton icon="close" onClick={onClose} />
          </div>
        )}
      >
        <Editor placeholder="What's happening?" className={styles.editor} />
      </Modal>
    </EditorCommandsProvider>
  );
}

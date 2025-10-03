import {
  EditorCommandsProvider,
  useEditorCommands,
} from "@/app/context/EditorCommands";
import IconButton from "../../common/IconButton";
import Modal from "../../common/Modal";
import Editor from "../Editor";
import styles from "./PostEditorPhone.module.css";

interface PostEditorPhoneProps {
  isOpen: boolean;
  onClose: () => void;
}

function PhoneEditorModal({ isOpen, onClose }: PostEditorPhoneProps) {
  const { addImageDrop } = useEditorCommands();
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
          <IconButton icon="send" onClick={() => {}} variant="primary" />
        </div>
      )}
    >
      <Editor placeholder="What's happening?" className={styles.editor} />
    </Modal>
  );
}

export default function PostEditorPhone({
  isOpen,
  onClose,
}: PostEditorPhoneProps) {
  return (
    <EditorCommandsProvider>
      <PhoneEditorModal isOpen={isOpen} onClose={onClose} />
    </EditorCommandsProvider>
  );
}

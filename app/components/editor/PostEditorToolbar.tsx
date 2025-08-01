import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";

interface PostEditorToolbarProps {
  onPost: () => void;
}

export default function PostEditorToolbar({ onPost }: PostEditorToolbarProps) {
  return (
    <div className={styles.postEditorToolbar}>
      <Button icon="send" onClick={onPost}>
        Post
      </Button>
    </div>
  );
}

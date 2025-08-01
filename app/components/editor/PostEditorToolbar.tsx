import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";

interface PostEditorToolbarProps {
  onPost: () => void;
  isPosting: boolean;
}

export default function PostEditorToolbar({
  onPost,
  isPosting,
}: PostEditorToolbarProps) {
  return (
    <div className={styles.postEditorToolbar}>
      <Button icon="send" onClick={onPost} disabled={isPosting}>
        Post
      </Button>
    </div>
  );
}

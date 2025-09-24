import styles from "./Toolbar.module.css";
import IconButton from "../common/IconButton";

export default function Toolbar() {
  return (
    <div className={styles.toolbar}>
      <IconButton
        icon="ellipsis"
        label="More!"
        className={styles.overflowMenuButton}
      />
      <IconButton
        icon="pen"
        variant="primary"
        label="New post"
        className={styles.newPostButton}
      />
      <IconButton
        icon="toggles"
        label="Feed settings"
        className={styles.feedSettingsButton}
      />
      <IconButton
        icon="gear"
        label="Admin"
        className={styles.adminSettingsButton}
        iconSize={32}
      />
    </div>
  );
}

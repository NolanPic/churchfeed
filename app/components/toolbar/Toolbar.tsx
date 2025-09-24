import styles from "./Toolbar.module.css";
import IconButton from "../common/IconButton";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import OverflowMenu from "./OverflowMenu";

export default function Toolbar() {
  const { isSignedIn } = useAuthedUser();

  return (
    <div className={styles.toolbar}>
      {isSignedIn && (
        <>
          <IconButton
            icon="ellipsis"
            ariaLabel="More options"
            className={styles.overflowMenuButton}
            popoverTarget="overflow-menu"
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
          <OverflowMenu />
        </>
      )}
    </div>
  );
}

import styles from "./Toolbar.module.css";
import IconButton from "../common/IconButton";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import OverflowMenu from "./OverflowMenu";
import FeedSelector from "../FeedSelector";
import { useContext } from "react";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";

export default function Toolbar() {
  const { isSignedIn, user, feeds: userFeeds } = useAuthedUser();
  const { feedId } = useContext(CurrentFeedAndPostContext);
  const isFeedOwner = !!(
    feedId && userFeeds.find((f) => f._id === feedId && f.owner)
  );
  const isAdmin = user?.type === "admin";

  return (
    <div className={styles.toolbar}>
      {isSignedIn && (
        <>
          <div className={styles.feedSelectorContainer}>
            <FeedSelector />
          </div>
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
          {isFeedOwner && (
            <IconButton
              icon="toggles"
              label="Feed settings"
              className={styles.feedSettingsButton}
            />
          )}
          {isAdmin && (
            <IconButton
              icon="gear"
              label="Admin"
              className={styles.adminSettingsButton}
              iconSize={32}
            />
          )}
          <OverflowMenu
            showAdminSettings={isAdmin}
            showFeedSettings={isFeedOwner}
          />
        </>
      )}
    </div>
  );
}

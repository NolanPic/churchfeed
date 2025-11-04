import styles from "./Toolbar.module.css";
import IconButton from "../common/IconButton";
import { useUserAuth } from "@/auth/client/useUserAuth";
import OverflowMenu from "./OverflowMenu";
import FeedSelector from "../FeedSelector";
import { useContext, RefObject, useState, useEffect } from "react";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFloating, offset } from "@floating-ui/react-dom";

interface ToolbarProps {
  onNewPost: () => void;
  isNewPostOpen: boolean;
  setIsNewPostOpen: (isNewPostOpen: boolean) => void;
  feedWrapperRef: RefObject<HTMLDivElement | null>;
}

export default function Toolbar({
  onNewPost,
  isNewPostOpen,
  setIsNewPostOpen,
  feedWrapperRef,
}: ToolbarProps) {
  const [auth, { user }] = useUserAuth();
  const { feedId } = useContext(CurrentFeedAndPostContext);
  const [isFeedOwner, setIsFeedOwner] = useState(false);

  const isSignedIn = auth !== null;
  const isAdmin = user?.role === "admin";

  // Check feed ownership asynchronously
  useEffect(() => {
    if (!auth || !feedId) {
      setIsFeedOwner(false);
      return;
    }

    auth
      .feed(feedId)
      .hasRole("owner")
      .then((result) => {
        setIsFeedOwner(result.allowed);
      });
  }, [auth, feedId]);

  const showNewPostButton = !isNewPostOpen;
  const showCloseButton = !showNewPostButton;

  // position the close button relative to the feed
  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: feedWrapperRef.current,
    },
    placement: "right-start",
    middleware: [offset({ mainAxis: 32 })],
  });

  return (
    <>
      <div className={styles.toolbar}>
        {isSignedIn && (
          <>
            <div className={styles.feedSelectorContainer}>
              <FeedSelector variant="inToolbar" />
            </div>
            <IconButton
              icon="ellipsis"
              ariaLabel="More options"
              className={styles.overflowMenuButton}
              popoverTarget="overflow-menu"
            />
            {showNewPostButton && (
              <IconButton
                icon="pen"
                variant="primary"
                label="New post"
                className={styles.newPostButton}
                onClick={onNewPost}
              />
            )}

            {isFeedOwner && feedId && (
              <IconButton
                icon="toggles"
                label="Feed settings"
                className={styles.feedSettingsButton}
                as="link"
                href={`/feed/${feedId}/settings`}
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

      {isSignedIn &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showCloseButton && (
              <motion.div
                ref={refs.setFloating}
                style={floatingStyles}
                initial={{ opacity: 0, marginTop: `var(--spacing13)` }}
                animate={{ opacity: 1, marginTop: 0 }}
                exit={{ opacity: 0, marginTop: `var(--spacing13)` }}
                transition={{ duration: 0.2 }}
                className={styles.closeNewPostButton}
              >
                <IconButton
                  icon="close"
                  ariaLabel="Close post editor"
                  onClick={() => setIsNewPostOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

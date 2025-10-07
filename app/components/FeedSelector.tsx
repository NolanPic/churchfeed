import Button from "./common/Button";
import styles from "./FeedSelector.module.css";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";
import { useContext } from "react";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useState } from "react";
import Backdrop from "./common/Backdrop";
import { Id } from "../../convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollToTop } from "@/app/hooks/useScrollToTop";
import classNames from "classnames";
import { useRouter } from "next/navigation";

type FeedSelectorVariant = "topOfFeed" | "inToolbar";
interface FeedSelectorProps {
  variant: FeedSelectorVariant;
  chooseFeedForNewPost?: boolean;
  onClose?: () => void;
}

export default function FeedSelector({
  variant,
  chooseFeedForNewPost = false,
  onClose,
}: FeedSelectorProps) {
  const { feedId: selectedFeedId, setFeedId } = useContext(
    CurrentFeedAndPostContext
  );
  const org = useOrganization();
  const [isOpen, setIsOpen] = useState(chooseFeedForNewPost);
  const scrollToTop = useScrollToTop();
  const router = useRouter();

  const feeds =
    useQuery(api.feeds.getUserFeeds, org ? { orgId: org._id } : "skip") || [];

  if (!org) return null;

  const selectedFeed =
    feeds.find((feed) => feed._id === selectedFeedId)?.name || "All feeds";

  const onSelectFeed = (feedId: Id<"feeds"> | undefined) => {
    setIsOpen(false);
    setFeedId(feedId);
    scrollToTop();

    const targetPath = feedId ? `/feed/${feedId}` : `/`;
    const pathWithQuery = chooseFeedForNewPost
      ? `${targetPath}?openEditor=true`
      : targetPath;

    router.push(pathWithQuery);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {!chooseFeedForNewPost && (
        <>
          <div className={classNames(styles.selectedFeed, styles[variant])}>
            <h2 className={styles.feedSelectorTitle}>
              What&apos;s happening in
            </h2>
            <Button
              icon="dropdown-arrow"
              iconSize={10}
              className={styles.feedSelector}
              onClick={() => setIsOpen(true)}
            >
              {selectedFeed}
            </Button>
          </div>

          <hr
            className={classNames(styles.feedSelectorRule, styles[variant])}
          />
        </>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.feedList}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <ol>
              {chooseFeedForNewPost && (
                <li>
                  <h2 className={styles.chooseFeedHeading}>
                    Select a feed to post in
                  </h2>
                </li>
              )}
              {!chooseFeedForNewPost && (
                <li
                  key="all"
                  className={!selectedFeedId ? styles.selected : ""}
                >
                  <label>
                    <input
                      type="radio"
                      checked={!selectedFeedId}
                      onChange={() => onSelectFeed(undefined)}
                    />
                    All feeds
                  </label>
                </li>
              )}
              {feeds.map((feed) => (
                <li
                  key={feed._id}
                  className={selectedFeedId === feed._id ? styles.selected : ""}
                >
                  <label>
                    <input
                      type="radio"
                      checked={selectedFeedId === feed._id}
                      onChange={() => onSelectFeed(feed._id)}
                    />
                    {feed.name}
                  </label>
                </li>
              ))}
            </ol>
            <Backdrop onClick={handleClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

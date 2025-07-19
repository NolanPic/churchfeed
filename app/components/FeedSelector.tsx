import styles from "./FeedSelector.module.css";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import Backdrop from "./common/Backdrop";
import { motion, AnimatePresence } from "framer-motion";
import classNames from "classnames";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FeedSelector({
  selectedFeedId,
  setSelectedFeedId,
  orgId,
}: {
  selectedFeedId: Id<"feeds"> | null;
  setSelectedFeedId: (feedId: Id<"feeds"> | null) => void;
  orgId: Id<"organizations">;
}) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const feeds =
    useQuery(api.feeds.getPublicFeeds, {
      orgId,
    }) || [];

  const selectedFeed =
    feeds.find((feed) => feed._id === selectedFeedId)?.name || "All feeds";

  const selectFeed = (feedId: Id<"feeds"> | null) => {
    setIsOpen(false);
    setSelectedFeedId(feedId);
    if (feedId) {
      router.push(`/feed/${feedId}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <>
      <nav className={styles.feedSelector} data-testid="feed-selector">
        <button
          className={styles.feedSelectorButton}
          onClick={() => setIsOpen(!isOpen)}
          role="combobox"
          aria-haspopup="listbox"
          aria-controls="feed-selector-dropdown"
          aria-activedescendant={`option-${selectedFeedId}`}
          aria-expanded={isOpen}
        >
          <span className={styles.selectedFeedName}>{selectedFeed}</span>
          <Image
            className={styles.dropdownArrow}
            src="/icons/dropdown-arrow.svg"
            alt="Expand feed selector"
            width={10}
            height={8}
          />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ height: "36px", borderWidth: 0 }}
              animate={{ height: "auto", borderWidth: 1 }}
              exit={{ height: "36px", borderWidth: 0 }}
              transition={{ duration: 0.15 }}
              className={styles.feedSelectorDropdown}
              id="feed-selector-dropdown"
              role="listbox"
              tabIndex={-1}
              aria-multiselectable={false}
            >
              <li
                key="all"
                className={classNames({
                  [styles.selectedFeed]: selectedFeedId === null,
                })}
              >
                <label>
                  <input
                    type="radio"
                    checked={selectedFeedId === null}
                    onChange={() => selectFeed(null)}
                    id={`option-all`}
                    role="option"
                    aria-selected={selectedFeedId === null}
                  />
                  <span>All feeds</span>
                </label>
              </li>
              {feeds.map((feed) => (
                <li
                  key={feed._id}
                  className={classNames({
                    [styles.selectedFeed]: selectedFeedId === feed._id,
                  })}
                >
                  <label>
                    <input
                      type="radio"
                      checked={selectedFeedId === feed._id}
                      onChange={() => selectFeed(feed._id as Id<"feeds">)}
                      id={`option-${feed._id}`}
                      role="option"
                      aria-selected={selectedFeedId === feed._id}
                    />
                    <span>{feed.name}</span>
                  </label>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </nav>
      <AnimatePresence>
        {isOpen && <Backdrop onClick={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

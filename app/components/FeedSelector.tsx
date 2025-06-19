import styles from "./FeedSelector.module.css";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";
import Backdrop from "./common/Backdrop";

export default function FeedSelector({
  selectedFeedId,
  setSelectedFeedId,
}: {
  selectedFeedId: Id<"feeds"> | "all";
  setSelectedFeedId: (feedId: Id<"feeds"> | "all") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const feeds =
    useQuery(api.feeds.getPublicFeeds, {
      orgId: "j9741k251gw6wwt80s9vq3agfd7erh7s" as Id<"organizations">,
    }) || [];

  const selectedFeed =
    feeds.find((feed) => feed._id === selectedFeedId)?.name || "All feeds";

  const selectFeed = (feedId: Id<"feeds"> | "all") => {
    setIsOpen(false);
    setSelectedFeedId(feedId);
  };

  return (
    <>
      <nav className={styles.feedSelector}>
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
          <img
            className={styles.dropdownArrow}
            src="/icons/dropdown-arrow.svg"
            alt="Expand feed selector"
          />
        </button>
        {isOpen && (
          <ul
            className={styles.feedSelectorDropdown}
            id="feed-selector-dropdown"
            role="listbox"
            tabIndex={-1}
            aria-multiselectable={false}
          >
            <li>
              <label>
                <input
                  type="radio"
                  checked={selectedFeedId === "all"}
                  onChange={() => selectFeed("all")}
                  id={`option-all`}
                  role="option"
                  aria-selected={selectedFeedId === "all"}
                />
                <span>All feeds</span>
              </label>
            </li>
            {feeds.map((feed) => (
              <li key={feed._id}>
                <label>
                  <input
                    type="radio"
                    checked={selectedFeedId === feed._id}
                    onChange={() => selectFeed(feed._id)}
                    id={`option-${feed._id}`}
                    role="option"
                    aria-selected={selectedFeedId === feed._id}
                  />
                  <span>{feed.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </nav>
      {isOpen && <Backdrop onClick={() => setIsOpen(false)} />}
    </>
  );
}

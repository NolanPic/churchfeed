import styles from "./FeedSelector.module.css";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

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
    <nav className={styles.feedSelector}>
      <div
        className={styles.feedSelectorClickable}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectedFeedName}>{selectedFeed}</span>
        <img
          className={styles.dropdownArrow}
          src="/icons/dropdown-arrow.svg"
          alt="Expand feed selector"
        />
      </div>
      {isOpen && (
        <ul className={styles.feedSelectorDropdown}>
          <li onClick={() => selectFeed("all")}>All feeds</li>
          {feeds.map((feed) => (
            <li key={feed._id} onClick={() => selectFeed(feed._id)}>
              {feed.name}
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

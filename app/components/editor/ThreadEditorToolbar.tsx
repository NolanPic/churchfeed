// DEPRECATED - DO NOT USE - This component is no longer used
import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";
import Select from "../common/Select";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface PostEditorToolbarProps {
  onPost: (feedId: Id<"feeds">) => void;
  isPosting: boolean;
  feedId: Id<"feeds"> | null;
}

export default function PostEditorToolbar({
  onPost,
  isPosting,
  feedId,
}: PostEditorToolbarProps) {
  // Stubbed for deprecated component
  const feeds: { value: Id<"feeds">; label: string }[] = [];
  const [feedIdToPostTo, setFeedIdToPostTo] = useState<Id<"feeds"> | null>(
    feedId
  );

  const feedOptions = feeds;

  const isPostingDisabled = feedOptions.length === 0;

  return (
    <div className={styles.threadEditorToolbar}>
      <Select
        options={feedOptions}
        defaultValue={feedIdToPostTo ?? undefined}
        prependToSelected="Post in: "
        placeholder={
          isPostingDisabled ? "No feed memberships" : "Choose a feed"
        }
        className={styles.feedSelect}
        disabled={isPostingDisabled}
        onChange={(value) => setFeedIdToPostTo(value as Id<"feeds">)}
      />
      <Button
        icon="send"
        onClick={feedIdToPostTo ? () => onPost(feedIdToPostTo) : undefined}
        disabled={isPosting || isPostingDisabled}
        variant="primary"
      >
        Post
      </Button>
    </div>
  );
}

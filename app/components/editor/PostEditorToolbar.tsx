import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";
import Select from "../common/Select";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import { useMemo, useState } from "react";
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
  const { feeds } = useAuthedUser();
  const [feedIdToPostTo, setFeedIdToPostTo] = useState<Id<"feeds"> | null>(
    feedId
  );

  const feedOptions = useMemo(
    () =>
      feeds
        ?.map((feed) => {
          if (feed.owner || feed.memberPermissions?.includes("post")) {
            return {
              value: feed._id,
              label: feed.name,
            };
          }
          return null;
        })
        .filter((option) => option !== null) || [],
    [feeds]
  );

  const isPostingDisabled = feedOptions.length === 0;

  return (
    <div className={styles.postEditorToolbar}>
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
        className={styles.postButton}
        variant="primary"
      >
        Post
      </Button>
    </div>
  );
}

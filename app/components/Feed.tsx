import styles from "./Feed.module.css";
import FeedSelector from "./FeedSelector";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FeedPost from "./FeedPost";

interface FeedProps {
  orgId: Id<"organizations">;
  feedId: Id<"feeds">;
}

export default function Feed({ orgId, feedId }: FeedProps) {
  const posts = useQuery(api.posts.getPublicFeedPosts, {
    orgId,
    feedId,
  });

  return (
    <>
      <div className={styles.feedSelectorWrapper}>
        <FeedSelector />
      </div>
      <div className={styles.feedWrapper}>
        <h2 className={styles.feedIntro}>What&apos;s happening?</h2>
        <hr className={styles.feedIntroRule} />
        <main className={styles.feedPosts}>
          {posts?.map((post) => <FeedPost key={post._id} post={post} />)}
        </main>
      </div>
    </>
  );
}

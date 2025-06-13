"use client";

import styles from "./Feed.module.css";
import FeedSelector from "./FeedSelector";
import { useQuery } from "convex/react";
import { useState, Suspense } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FeedPost from "./FeedPost";
import FeedSkeleton from "./FeedSkeleton";

interface FeedProps {
  orgId: Id<"organizations">;
}

export default function Feed({ orgId }: FeedProps) {
  const [feedId] = useState<Id<"feeds">>(
    "k9731m7p1z48t2dtjv640fpesd7hbrg2" as Id<"feeds">
  );

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
          {posts ? (
            posts?.map((post) => <FeedPost key={post._id} post={post} />)
          ) : (
            <FeedSkeleton />
          )}
        </main>
      </div>
    </>
  );
}

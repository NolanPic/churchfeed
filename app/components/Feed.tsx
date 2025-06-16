"use client";

import styles from "./Feed.module.css";
import FeedSelector from "./FeedSelector";
import { useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FeedPost from "./FeedPost";
import FeedSkeleton from "./FeedSkeleton";
import useViewportHeight from "@/app/hooks/useViewportHeight";

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

  const vh = useViewportHeight();
  const endOfFeed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(`isIntersecting: ${entries[0].isIntersecting}`);
      },
      {
        rootMargin: `${vh + vh * 0.5}px`,
      }
    );
    if (endOfFeed.current) {
      observer.observe(endOfFeed.current);
    }
  }, [vh]);

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
            posts?.map((post, idx) => {
              return <FeedPost key={post._id} post={post} />;
            })
          ) : (
            <FeedSkeleton />
          )}
        </main>
        <div ref={endOfFeed} />
      </div>
    </>
  );
}

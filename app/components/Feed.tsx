"use client";

import styles from "./Feed.module.css";
import FeedSelector from "./FeedSelector";
import { usePaginatedQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import FeedPost from "./FeedPost";
import FeedSkeleton from "./FeedSkeleton";
import useViewportHeight from "@/app/hooks/useViewportHeight";
import { motion } from "framer-motion";

interface FeedProps {
  orgId: Id<"organizations">;
}

export default function Feed({ orgId }: FeedProps) {
  const itemsPerPage = 10;
  const [feedId, setFeedId] = useState<Id<"feeds"> | "all">("all");

  useEffect(() => setFeedId("all"), [orgId]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getPublicFeedPosts,
    {
      orgId,
      feedId: feedId === "all" ? undefined : feedId,
    },
    {
      initialNumItems: itemsPerPage,
    }
  );

  const vh = useViewportHeight();
  const endOfFeed = useRef<HTMLDivElement>(null);

  const intersectionCb = useRef<IntersectionObserverCallback | null>(null);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && status === "CanLoadMore") {
      loadMore(itemsPerPage);
    }
  };

  useEffect(() => {
    intersectionCb.current = handleIntersection;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        intersectionCb.current?.(entries, observer);
      },
      {
        rootMargin: `${vh * 0.5}px`,
      }
    );
    if (endOfFeed.current) {
      observer.observe(endOfFeed.current);
    }
    return () => observer.disconnect();
  }, [vh]);

  return (
    <>
      <div className={styles.feedSelectorWrapper}>
        <FeedSelector
          orgId={orgId}
          selectedFeedId={feedId}
          setSelectedFeedId={setFeedId}
        />
      </div>
      <div className={styles.feedWrapper}>
        <h2 className={styles.feedIntro}>What&apos;s happening?</h2>
        <motion.hr
          initial={{ width: 0 }}
          animate={{ width: "var(--intro-rule-width)" }}
          transition={{ duration: 0.25 }}
          className={styles.feedIntroRule}
        />
        <main className={styles.feedPosts} data-testid="feed-posts">
          {status === "LoadingFirstPage" ? (
            <FeedSkeleton />
          ) : (
            results.map((post) => {
              return <FeedPost key={post._id} post={post} />;
            })
          )}
        </main>
        <div ref={endOfFeed} />
      </div>
    </>
  );
}

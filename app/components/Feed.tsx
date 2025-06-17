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

interface FeedProps {
  orgId: Id<"organizations">;
}

export default function Feed({ orgId }: FeedProps) {
  const itemsPerPage = 10;
  const [feedId] = useState<Id<"feeds">>(
    "k9731m7p1z48t2dtjv640fpesd7hbrg2" as Id<"feeds">
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getPublicFeedPosts,
    {
      orgId,
      feedId,
    },
    {
      initialNumItems: itemsPerPage,
    }
  );

  const vh = useViewportHeight();
  const endOfFeed = useRef<HTMLDivElement>(null);

  const intersectionCb = useRef<IntersectionObserverCallback | null>(null);

  const handleIntersection = (
    entries: IntersectionObserverEntry[],
    _observer: IntersectionObserver
  ) => {
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
        <FeedSelector />
      </div>
      <div className={styles.feedWrapper}>
        <h2 className={styles.feedIntro}>What&apos;s happening?</h2>
        <hr className={styles.feedIntroRule} />
        <main className={styles.feedPosts}>
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

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
import { motion, AnimatePresence } from "framer-motion";
import { useOrganization } from "../context/OrganizationProvider";
import PostEditor from "./editor/PostEditor";
import NewPostButton from "./editor/NewPostButton";
import { useAuthedUser } from "../hooks/useAuthedUser";
import PostModalContent from "./PostModalContent";
import Modal from "./common/Modal";
import useHistoryRouter from "@/app/hooks/useHistoryRouter";

interface FeedProps {
  feedIdSlug: Id<"feeds"> | null;
  postIdSlug?: Id<"posts"> | null;
}

export default function Feed({ feedIdSlug, postIdSlug }: FeedProps) {
  const itemsPerPage = 10;
  const [feedId, setFeedId] = useState<Id<"feeds"> | null>(feedIdSlug);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const { isSignedIn } = useAuthedUser();
  const [openPostId, setOpenPostId] = useState<Id<"posts"> | null>(null);

  const historyRouter = useHistoryRouter((path) => {
    const segments = path.split("/").filter(Boolean);
    if (segments[0] === "post" && segments[1]) {
      setOpenPostId(segments[1] as Id<"posts">);
    } else {
      setOpenPostId(null);
    }
  });

  useEffect(() => setFeedId(feedIdSlug), [org, feedIdSlug]);

  useEffect(() => {
    if (postIdSlug) {
      setOpenPostId(postIdSlug);
    }
  }, [postIdSlug]);

  // Keep modal state in sync with browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      if (segments[0] === "post" && segments[1]) {
        setOpenPostId(segments[1] as Id<"posts">);
      } else {
        setOpenPostId(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const { results, status, loadMore } = usePaginatedQuery(
    api.posts.getUserPosts,
    {
      orgId,
      selectedFeedId: feedId === null ? undefined : feedId,
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

  const handleOpenPost = (postId: Id<"posts">) => {
    setOpenPostId(postId);
    historyRouter.push(`/post/${postId}`);
  };

  const handleClosePost = () => {
    setOpenPostId(null);
    historyRouter.push(feedId ? `/feed/${feedId}` : `/`);
  };

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
        {isSignedIn && (
          <NewPostButton
            isOpen={isNewPostOpen}
            onClick={() => setIsNewPostOpen(!isNewPostOpen)}
          />
        )}
        <AnimatePresence>
          {isNewPostOpen && (
            <PostEditor
              isOpen={isNewPostOpen}
              setIsOpen={setIsNewPostOpen}
              feedId={feedId}
            />
          )}
        </AnimatePresence>
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
              return (
                <FeedPost
                  key={post._id}
                  post={post}
                  showSourceFeed={!feedId}
                  onOpenPost={handleOpenPost}
                />
              );
            })
          )}
        </main>
        <div ref={endOfFeed} />
      </div>

      <Modal
        isOpen={!!openPostId}
        onClose={handleClosePost}
        ariaLabel="Post details and messages"
      >
        {openPostId && <PostModalContent postId={openPostId} />}
      </Modal>
    </>
  );
}

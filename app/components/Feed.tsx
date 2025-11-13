"use client";

import styles from "./Feed.module.css";
import { usePaginatedQuery } from "convex/react";
import { useState, useRef, useEffect, useContext } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Post from "./Post";
import FeedSkeleton from "./FeedSkeleton";
import useViewportHeight from "@/app/hooks/useViewportHeight";
import { AnimatePresence } from "framer-motion";
import { useOrganization } from "../context/OrganizationProvider";
import PostEditor from "./editor/PostEditor";
import PostModalContent from "./PostModalContent";
import FeedSettingsModalContent, {
  FeedSettingsModalContentHandle,
} from "./FeedSettingsModalContent";
import FeedMembersTab from "./FeedMembersTab";
import Modal from "./common/Modal";
import useHistoryRouter from "@/app/hooks/useHistoryRouter";
import { CurrentFeedAndPostContext } from "../context/CurrentFeedAndPostProvider";
import FeedSelector from "./FeedSelector";
import Toolbar from "./toolbar/Toolbar";
import PostEditorPhone from "./editor/phone/PostEditorPhone";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";

interface FeedProps {
  feedIdSlug: Id<"feeds"> | null;
  postIdSlug?: Id<"posts"> | null;
  feedSettingsFeedIdSlug?: Id<"feeds"> | null;
}

export default function Feed({
  feedIdSlug,
  postIdSlug,
  feedSettingsFeedIdSlug,
}: FeedProps) {
  const itemsPerPage = 10;
  const {
    feedId,
    postId: openPostId,
    setFeedId,
    setPostId: setOpenPostId,
  } = useContext(CurrentFeedAndPostContext);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isSelectingFeedForPost, setIsSelectingFeedForPost] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState("settings");
  const [isFeedOwner, setIsFeedOwner] = useState(false);
  const [isFeedMember, setIsFeedMember] = useState(false);
  const [auth] = useUserAuth();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedWrapperRef = useRef<HTMLDivElement>(null);
  const feedSettingsModalContentRef =
    useRef<FeedSettingsModalContentHandle | null>(null);

  const historyRouter = useHistoryRouter((path) => {
    const segments = path.split("/").filter(Boolean);
    if (segments[0] === "post" && segments[1]) {
      setOpenPostId(segments[1] as Id<"posts">);
    } else {
      setOpenPostId(undefined);
    }
  });

  // Fix TS type mismatch: context setter expects undefined to clear, not null
  useEffect(
    () => setFeedId(feedIdSlug ?? undefined),
    [org, feedIdSlug, setFeedId]
  );

  useEffect(() => {
    if (postIdSlug) {
      setOpenPostId(postIdSlug);
    }
  }, [postIdSlug, setOpenPostId]);

  // Keep modal state in sync with browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      if (segments[0] === "post" && segments[1]) {
        setOpenPostId(segments[1] as Id<"posts">);
      } else {
        setOpenPostId(undefined);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setOpenPostId]);

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

  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");

  const handleOpenPost = (postId: Id<"posts">) => {
    setOpenPostId(postId);
    historyRouter.push(`/post/${postId}`);
  };

  const handleClosePost = () => {
    setOpenPostId(undefined);
    historyRouter.push(feedId ? `/feed/${feedId}` : `/`);
  };

  const handleNewPostClick = () => {
    if (!feedId) {
      setIsSelectingFeedForPost(true);
    } else {
      setIsNewPostOpen(true);
    }
  };

  const handleCloseFeedSelector = () => {
    setIsSelectingFeedForPost(false);
  };

  const handleCloseFeedSettings = () => {
    // Check for unsaved changes via the component ref
    const feedSettingsContent = feedSettingsModalContentRef.current;
    const hasUnsavedChanges =
      feedSettingsContent?.hasUnsavedChanges?.() ?? false;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) {
        return;
      }
    }

    // Navigate back to the feed
    router.push(feedId ? `/feed/${feedId}` : `/`);
  };

  const removeEditorQueryParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("openEditor");
    window.history.replaceState({}, "", url.pathname);
  };

  // Watch for openEditor query parameter to open editor after navigation
  useEffect(() => {
    if (searchParams.get("openEditor") === "true") {
      setIsSelectingFeedForPost(false);
      setIsNewPostOpen(true);
      removeEditorQueryParam();
    }
  }, [searchParams]);

  // Check feed ownership and membership when the modal opens
  useEffect(() => {
    if (!auth || !feedSettingsFeedIdSlug) {
      setIsFeedOwner(false);
      setIsFeedMember(false);
      setSettingsActiveTab("settings");
      return;
    }

    // Check if user is an owner
    auth
      .feed(feedSettingsFeedIdSlug)
      .hasRole("owner")
      .then((result) => {
        setIsFeedOwner(result.allowed);
        // If user is not an owner, switch to members tab
        if (!result.allowed) {
          setSettingsActiveTab("members");
        }
      });

    // Check if user is a member (includes owners)
    auth
      .feed(feedSettingsFeedIdSlug)
      .hasRole("member")
      .then((result) => {
        setIsFeedMember(result.allowed);
      });
  }, [auth, feedSettingsFeedIdSlug]);

  // Define modal tabs
  const settingsTab = {
    id: "settings",
    label: "Settings",
    content: feedSettingsFeedIdSlug ? (
      <FeedSettingsModalContent
        ref={feedSettingsModalContentRef}
        feedId={feedSettingsFeedIdSlug}
      />
    ) : null,
  };

  const membersTab = {
    id: "members",
    label: "Members",
    content: feedSettingsFeedIdSlug ? (
      <FeedMembersTab feedId={feedSettingsFeedIdSlug} />
    ) : null,
  };

  const modalTabs = isFeedOwner
    ? [settingsTab, membersTab]
    : [membersTab];

  return (
    <>
      <div className={styles.feedWrapper} ref={feedWrapperRef}>
        <Toolbar
          onNewPost={handleNewPostClick}
          isNewPostOpen={isNewPostOpen}
          setIsNewPostOpen={setIsNewPostOpen}
          feedWrapperRef={feedWrapperRef}
        />
        <div className={styles.feedSelectorTabletUp}>
          <FeedSelector variant="topOfFeed" />
        </div>
        {isSelectingFeedForPost && (
          <FeedSelector
            variant="topOfFeed"
            chooseFeedForNewPost
            onClose={handleCloseFeedSelector}
          />
        )}
        <AnimatePresence>
          {isNewPostOpen && isTabletOrUp && (
            <PostEditor
              isOpen={isNewPostOpen}
              setIsOpen={setIsNewPostOpen}
              feedId={feedId ?? null}
            />
          )}
        </AnimatePresence>
        <main className={styles.feedPosts} data-testid="feed-posts">
          {status === "LoadingFirstPage" ? (
            <FeedSkeleton />
          ) : (
            results.map((post) => {
              return (
                <div key={post._id} className={styles.feedPost}>
                  <Post
                    post={post}
                    variant="feed"
                    showSourceFeed={!feedId}
                    onOpenPost={handleOpenPost}
                  />
                </div>
              );
            })
          )}
        </main>
        <div ref={endOfFeed} />
      </div>

      {!isTabletOrUp && (
        <PostEditorPhone
          isOpen={isNewPostOpen}
          onClose={() => setIsNewPostOpen(false)}
          feedId={feedId ?? null}
        />
      )}

      <Modal
        isOpen={!!openPostId}
        onClose={handleClosePost}
        ariaLabel="Post details and messages"
        dragToClose
      >
        {openPostId && (
          <PostModalContent postId={openPostId} onClose={handleClosePost} />
        )}
      </Modal>

      <Modal
        isOpen={!!feedSettingsFeedIdSlug}
        onClose={handleCloseFeedSettings}
        title={isFeedOwner ? "Feed Settings" : "Members"}
        tabs={modalTabs}
        activeTabId={settingsActiveTab}
        onTabChange={setSettingsActiveTab}
      >
      </Modal>
    </>
  );
}

"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { motion } from "motion/react";
import OpenFeedCard from "./OpenFeedCard";
import Button from "../common/Button";
import styles from "./OpenFeedsBrowser.module.css";

interface OpenFeedsBrowserProps {
  onClose: () => void;
}

type AvatarUser = {
  _id: Id<"users">;
  name: string;
  image: string | null;
};

const FEEDS_PER_PAGE = 20;

const OpenFeedsBrowser = ({ onClose }: OpenFeedsBrowserProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  // Fetch user's feed memberships
  const userFeedsData = useQuery(
    api.feeds.getUserFeedsWithMemberships,
    orgId ? { orgId } : "skip",
  );
  const userFeeds = userFeedsData?.userFeeds || [];

  // Create a set of feed IDs the user is a member of
  const userFeedIds = new Set(userFeeds.map((uf) => uf.feedId));

  // Fetch all open feeds with pagination
  const {
    results: feeds,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.feeds.getAllOpenFeeds,
    { orgId },
    { initialNumItems: FEEDS_PER_PAGE },
  );

  // Extract feed IDs from the current page
  const feedIds = feeds.map((feed) => feed._id);

  // Fetch members for all feeds on the current page
  const feedMembers = useQuery(
    api.userMemberships.getOpenFeedMembers,
    feedIds.length > 0 ? { orgId, feedIds } : "skip",
  );

  return (
    <>
      <motion.div
        className={styles.browser}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className={styles.header}>
          <Button
            onClick={onClose}
            noBackground
            className={styles.backButton}
            ariaLabel="Back to my feeds"
          >
            &lt; Back to my feeds
          </Button>
          <h2 className={styles.title}>All open feeds</h2>
        </div>

        <div className={styles.scrollContainer}>
          <div className={styles.feedList}>
            {status === "LoadingFirstPage" ? (
              <div className={styles.loading}>Loading...</div>
            ) : feeds.length === 0 ? (
              <div className={styles.empty}>No open feeds available</div>
            ) : (
              <>
                {feeds.map((feed) => {
                  const members = feedMembers?.[feed._id] || [];

                  return (
                    <OpenFeedCard
                      key={feed._id}
                      feed={feed}
                      isUserMember={userFeedIds.has(feed._id)}
                      users={members}
                    />
                  );
                })}
                {status === "CanLoadMore" && (
                  <div
                    ref={(el) => {
                      if (el) {
                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0]?.isIntersecting) {
                              loadMore(FEEDS_PER_PAGE);
                            }
                          },
                          { threshold: 0.1 },
                        );
                        observer.observe(el);
                        return () => observer.disconnect();
                      }
                    }}
                    className={styles.loadMoreTrigger}
                  />
                )}
                {status === "LoadingMore" && (
                  <div className={styles.loadingMore}>Loading more...</div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default OpenFeedsBrowser;

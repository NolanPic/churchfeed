"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { motion } from "motion/react";
import OpenFeedCard from "./OpenFeedCard";
import Button from "../common/Button";
import { CardList } from "../common/CardList";
import styles from "./OpenFeedsBrowser.module.css";
import { useUserAuth } from "@/auth/client/useUserAuth";

interface OpenFeedsBrowserProps {
  onClose: () => void;
}

const FEEDS_PER_PAGE = 20;

const OpenFeedsBrowser = ({ onClose }: OpenFeedsBrowserProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const [_auth, { userFeeds }] = useUserAuth();

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
    { initialNumItems: FEEDS_PER_PAGE }
  );

  // Extract feed IDs from the current page
  const feedIds = feeds.map((feed) => feed._id);

  // Fetch members for all feeds on the current page
  const feedMembers = useQuery(
    api.userMemberships.getOpenFeedMembers,
    feedIds.length > 0 ? { orgId, feedIds } : "skip"
  );

  return (
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

      <div className={styles.feedList}>
        <CardList
          data={feeds}
          status={status}
          loadMore={loadMore}
          itemsPerPage={FEEDS_PER_PAGE}
          emptyMessage="No open feeds available"
          className={styles.cardListContainer}
          renderCard={(feed) => {
            const members = feedMembers?.[feed._id] || [];
            return (
              <OpenFeedCard
                feed={feed}
                isUserMember={userFeedIds.has(feed._id)}
                users={members}
              />
            );
          }}
        />
      </div>
    </motion.div>
  );
};

export default OpenFeedsBrowser;

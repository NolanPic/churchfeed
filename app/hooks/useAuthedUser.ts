"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface FeedWithMembership extends Doc<"feeds"> {
  owner: boolean;
}

export const useAuthedUser = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const org = useOrganization();
  const orgId = org?._id ?? "" as Id<"organizations">;

  const user = useQuery(api.user.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
    orgId,
  });

  const feedsUserIsMemberOf = useQuery(api.feeds.getUserFeedsWithMemberships, {
    orgId,
  });

  // build feeds with memberships
  const { feeds, userFeeds } = feedsUserIsMemberOf || { feeds: [], userFeeds: [] };

  let userFeedMap = new Map<Id<"feeds">, Doc<"userFeeds">>();
  const feedsWithMemberships: FeedWithMembership[] = [];

  for(const userFeed of userFeeds) {
    userFeedMap.set(userFeed.feedId, userFeed);
  }

  for(const feed of feeds) {
    const userFeed = userFeedMap.get(feed._id);
    feedsWithMemberships.push({ ...feed, owner: userFeed?.owner ?? false });
  }

  return {
    user,
    clerkUser,
    organization: org,
    isSignedIn: isSignedIn && !!user,
    isLoaded,
    signOut,
    feeds: feedsWithMemberships,
  };
};
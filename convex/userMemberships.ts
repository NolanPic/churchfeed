import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getUserAuth } from "@/auth/convex";
import { getStorageUrl } from "./uploads";
import { paginationOptsValidator } from "convex/server";

/**
 * Helper function to check if a user is the last owner of a feed
 */
async function isLastOwner(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  feedId: Id<"feeds">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId)
    )
    .first();

  if (!membership?.owner) {
    return false;
  }

  const allOwners = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q.eq("orgId", orgId).eq("feedId", feedId)
    )
    .filter((q) => q.eq(q.field("owner"), true))
    .collect();

  return allOwners.length === 1;
}

/**
 * Get paginated list of members for a feed
 * Feed owners and feed members can call this
 */
export const getFeedMembers = query({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, paginationOpts } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const memberCheck = await auth.feed(feedId).hasRole("member");
    if (!memberCheck.allowed) {
      throw new Error("You do not have permission to view members of this feed");
    }

    const allUserFeeds = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId)
      )
      .collect();

    const membersWithDetails = await Promise.all(
      allUserFeeds.map(async (userFeed) => {
        const user = await ctx.db.get(userFeed.userId);
        if (!user) {
          return null;
        }

        const avatarUrl = await getStorageUrl(ctx, user.image);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: avatarUrl,
          isOwner: userFeed.owner,
        };
      })
    );

    const filteredMembers = membersWithDetails.filter(
      (member) => member !== null
    );

    const sortedMembers = filteredMembers.sort((a, b) => {
      // First sort by owner status
      if (a.isOwner !== b.isOwner) {
        return a.isOwner ? -1 : 1;
      }
      // Then sort by name
      return a.name.localeCompare(b.name);
    });

    // Manual pagination
    const { numItems, cursor } = paginationOpts;
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = offset + numItems;
    const page = sortedMembers.slice(offset, endIndex);
    const isDone = endIndex >= sortedMembers.length;
    const continueCursor = isDone ? null : endIndex.toString();

    return {
      page,
      isDone,
      continueCursor,
    };
  },
});

/**
 * Get users NOT in a feed
 * Only feed owners can call this
 */
export const getUsersNotInFeed = query({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to invite users to this feed"
      );
    }

    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deactivatedAt"), undefined))
      .collect();

    const userFeeds = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId)
      )
      .collect();

    const userIdsInFeed = new Set(userFeeds.map((uf) => uf.userId));

    const usersNotInFeed = allUsers.filter(
      (user) => !userIdsInFeed.has(user._id)
    );

    const usersWithAvatars = await Promise.all(
      usersNotInFeed.map(async (user) => {
        const avatarUrl = await getStorageUrl(ctx, user.image);
        return {
          _id: user._id,
          name: user.name,
          image: avatarUrl,
        };
      })
    );

    return usersWithAvatars;
  },
});

/**
 * Invite users to a feed
 * Only feed owners can call this
 */
export const inviteUsersToFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userIds } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to invite users to this feed"
      );
    }

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }
    if (feed.orgId !== orgId) {
      throw new Error("Feed does not belong to this organization");
    }

    const now = Date.now();

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      if (user.orgId !== orgId) {
        throw new Error(
          `User ${userId} does not belong to this organization`
        );
      }

      const existingMembership = await ctx.db
        .query("userFeeds")
        .withIndex("by_org_and_feed_and_user", (q) =>
          q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId)
        )
        .first();

      if (existingMembership) {
        throw new Error(`User ${user.name} is already a member of this feed`);
      }

      await ctx.db.insert("userFeeds", {
        orgId,
        userId,
        feedId,
        owner: false,
        updatedAt: now,
      });
    }

    return { success: true, invitedCount: userIds.length };
  },
});

/**
 * Remove a member from a feed
 * Only feed owners can call this, unless the user is removing themselves
 * If no userId is supplied, removes the currently authenticated user
 */
export const removeMemberFromFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const currentUser = auth.getUserOrThrow();

    const userToRemove = userId ?? currentUser._id;

    const isRemovingSelf = userToRemove === currentUser._id;

    if (!isRemovingSelf) {
      const ownerCheck = await auth.feed(feedId).hasRole("owner");
      if (!ownerCheck.allowed) {
        throw new Error(
          "You do not have permission to remove members from this feed"
        );
      }
    }

    const membershipToRemove = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userToRemove)
      )
      .first();

    if (!membershipToRemove) {
      throw new Error("User is not a member of this feed");
    }

    const isLast = await isLastOwner(ctx, orgId, feedId, userToRemove);
    if (isLast) {
      throw new Error(
        "Cannot remove the last owner from the feed. Please assign another owner first."
      );
    }

    await ctx.db.delete(membershipToRemove._id);

    return { success: true };
  },
});

/**
 * Change a member's role (member <-> owner)
 * Only feed owners can call this
 */
export const changeMemberRole = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userId: v.id("users"),
    isOwner: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userId, isOwner } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to change member roles in this feed"
      );
    }

    const membership = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this feed");
    }

    if (membership.owner && !isOwner) {
      const isLast = await isLastOwner(ctx, orgId, feedId, userId);
      if (isLast) {
        throw new Error(
          "Cannot demote the last owner. Please assign another owner first."
        );
      }
    }

    await ctx.db.patch(membership._id, {
      owner: isOwner,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

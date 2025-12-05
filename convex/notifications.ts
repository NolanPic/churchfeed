import { mutation, query, QueryCtx, internalMutation, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserAuth } from "@/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToPlainText } from "./utils/postContentConverter";
import { getAll } from "convex-helpers/server/relationships";
import webpush from "web-push";

const notificationTypeValidator = v.union(
  v.literal("new_post_in_member_feed"),
  v.literal("new_message_in_post"),
  v.literal("new_feed_member"),
  v.literal("new_user_needs_approval")
);

const notificationDataValidator = v.union(
  // new_post_in_member_feed
  v.object({
    userId: v.id("users"),
    feedId: v.id("feeds"),
    postId: v.id("posts"),
  }),
  // new_message_in_post
  v.object({
    userId: v.id("users"),
    messageId: v.id("messages"),
    messageContent: v.string(),
  }),
  // new_feed_member
  v.object({
    userId: v.id("users"),
    feedId: v.id("feeds"),
  }),
  // new_user_needs_approval
  v.object({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
  })
);

export type EnrichedNotification = Doc<"notifications"> & {
  title: string;
  body: string;
  action: {
    url: string;
  };
};

type CollectedNotificationData =
  | {
      type: "new_post_in_member_feed";
      user: Doc<"users"> | null;
      feed: Doc<"feeds"> | null;
      postId: Id<"posts">;
      feedId: Id<"feeds">;
    }
  | {
      type: "new_message_in_post";
      message: Doc<"messages"> | null;
      sender: Doc<"users"> | null;
      post: Doc<"posts"> | null;
      messageText: string;
      messageId: Id<"messages">;
    }
  | {
      type: "new_feed_member";
      user: Doc<"users"> | null;
      feed: Doc<"feeds"> | null;
      feedId: Id<"feeds">;
    }
  | {
      type: "new_user_needs_approval";
      user: Doc<"users"> | null;
      organization: Doc<"organizations"> | null;
    };

/**
 * Collect all data needed for a notification (called once per notification)
 * This fetches user names, feed names, etc. that are the same for all recipients
 */
export async function collectNotificationData(
  ctx: QueryCtx,
  notification: Doc<"notifications">
): Promise<CollectedNotificationData | null> {
  const { type, data } = notification;

  try {
    switch (type) {
      case "new_post_in_member_feed": {
        const typedData = data as { userId: Id<"users">; feedId: Id<"feeds">; postId: Id<"posts"> };
        const user = await ctx.db.get(typedData.userId);
        const feed = await ctx.db.get(typedData.feedId);

        return {
          type: "new_post_in_member_feed",
          user,
          feed,
          postId: typedData.postId,
          feedId: typedData.feedId,
        };
      }

      case "new_message_in_post": {
        const typedData = data as { userId: Id<"users">; messageId: Id<"messages">; messageContent: string };
        const message = await ctx.db.get(typedData.messageId);
        const sender = message ? await ctx.db.get(message.senderId) : null;
        const post = message ? await ctx.db.get(message.postId) : null;
        const messageText = fromJSONToPlainText(typedData.messageContent, 100);

        return {
          type: "new_message_in_post",
          message,
          sender,
          post,
          messageText,
          messageId: typedData.messageId,
        };
      }

      case "new_feed_member": {
        const typedData = data as { userId: Id<"users">; feedId: Id<"feeds"> };
        const user = await ctx.db.get(typedData.userId);
        const feed = await ctx.db.get(typedData.feedId);

        return {
          type: "new_feed_member",
          user,
          feed,
          feedId: typedData.feedId,
        };
      }

      case "new_user_needs_approval": {
        const typedData = data as { userId: Id<"users">; organizationId: Id<"organizations"> };
        const user = await ctx.db.get(typedData.userId);
        const organization = await ctx.db.get(typedData.organizationId);

        return {
          type: "new_user_needs_approval",
          user,
          organization,
        };
      }
    }
  } catch (error) {
    console.error("Error collecting notification data:", error);
    return null;
  }
}

/**
 * Generate personalized notification text for a specific user
 * Returns null if required entities are missing (which means notification should not be sent)
 * @param notification - The notification record from the database
 * @param collectedData - Data collected once for all recipients via collectNotificationData
 * @param targetUserId - The user who will receive this notification (for personalization)
 * @param userFeedData - Pre-fetched userFeed for ownership checks to avoid redundant queries when sending to multiple users
 */
export function generateNotificationText(
  notification: Doc<"notifications">,
  collectedData: CollectedNotificationData,
  targetUserId: Id<"users">,
  userFeedData?: Doc<"userFeeds"> | null
): EnrichedNotification | null {
  try {
    switch (collectedData.type) {
      case "new_post_in_member_feed": {
        const { user, feed, postId } = collectedData;

        if (!user || !feed) {
          return null;
        }

        const isOwner = userFeedData?.owner === true;

        return {
          ...notification,
          title: isOwner ? "New post in your feed" : "New post",
          body: isOwner
            ? `${user.name} just published a post in your feed, ${feed.name}`
            : `${user.name} just published a post in ${feed.name}`,
          action: {
            url: `/post/${postId}`,
          },
        };
      }

      case "new_message_in_post": {
        const { sender, post, messageText, messageId } = collectedData;

        if (!sender || !post) {
          return null;
        }

        const isOwner = post.posterId === targetUserId;

        return {
          ...notification,
          title: isOwner
            ? `${sender.name} messaged in your post`
            : `${sender.name} responded in a post`,
          body: messageText || "New message",
          action: {
            url: `/post/${post._id}#${messageId}`,
          },
        };
      }

      case "new_feed_member": {
        const { user, feed, feedId } = collectedData;

        if (!user || !feed) {
          return null;
        }

        return {
          ...notification,
          title: "Someone joined your feed",
          body: `${user.name} just joined ${feed.name}`,
          action: {
            url: `/feed/${feedId}`,
          },
        };
      }

      case "new_user_needs_approval": {
        const { user, organization } = collectedData;

        if (!user || !organization) {
          return null;
        }

        return {
          ...notification,
          title: "New user requesting to join",
          body: `${user.name} is requesting to join ${organization.name}`,
          action: {
            url: `/admin/users?filter=needs_approval`,
          },
        };
      }
    }
  } catch (error) {
    console.error("Error generating notification text:", error);
    return null;
  }
}

/**
 * Create a new notification (internal only)
 */
export const createNotification = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, userId, type, data } = args;

    const now = Date.now();
    const notificationId = await ctx.db.insert("notifications", {
      orgId,
      userId,
      type,
      data,
      updatedAt: now,
    });

    return notificationId;
  },
});

/**
 * Get user's notifications with pagination
 */
export const getUserNotifications = query({
  args: {
    orgId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, paginationOpts } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    const result = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id)
      )
      .order("desc")
      .paginate(paginationOpts);

    const enrichedPage = await Promise.all(
      result.page.map(async (notification) => {
        const collectedData = await collectNotificationData(ctx, notification);
        if (!collectedData) {
          return null;
        }

        let userFeedData: Doc<"userFeeds"> | null = null;
        if (collectedData.type === "new_post_in_member_feed") {
          userFeedData = await ctx.db
            .query("userFeeds")
            .withIndex("by_org_and_feed_and_user", (q) =>
              q.eq("orgId", orgId).eq("feedId", collectedData.feedId).eq("userId", user._id)
            )
            .first();
        }

        return generateNotificationText(notification, collectedData, user._id, userFeedData);
      })
    );

    const filteredPage = enrichedPage.filter((n): n is EnrichedNotification => n !== null);

    return {
      ...result,
      page: filteredPage,
    };
  },
});

/**
 * Get count of unread notifications for badge
 */
export const getUnreadCount = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .take(100);

    return unreadNotifications.length;
  },
});

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    orgId: v.id("organizations"),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const { orgId, notificationId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const notification = await ctx.db.get(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== user._id) {
      throw new Error("Unauthorized: notification does not belong to user");
    }

    await ctx.db.patch(notificationId, {
      readAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark all notifications as read
 */
export const clearNotifications = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .take(1000);

    const now = Date.now();
    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, {
          readAt: now,
        })
      )
    );

    return notifications.length;
  },
});

/**
 * Helper to convert user IDs to recipients with preferences
 * Filters out deactivated users and users with no notification preferences set
 */
async function userIdsToRecipients(
  ctx: QueryCtx,
  userIds: Id<"users">[]
): Promise<Array<{ userId: Id<"users">; preferences: Array<"push" | "email"> }>> {
  const users = await getAll(ctx.db, userIds);
  const recipients: Array<{ userId: Id<"users">; preferences: Array<"push" | "email"> }> = [];

  for (const user of users) {
    if (user && !user.deactivatedAt) {
      const preferences = user.settings?.notifications;
      if (preferences && preferences.length > 0) {
        recipients.push({ userId: user._id, preferences });
      }
    }
  }

  return recipients;
}

/**
 * Get all users who should receive a notification based on type and data
 * Returns users with their notification preferences
 */
async function getNotificationRecipients(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  type: string,
  data: any
): Promise<Array<{ userId: Id<"users">; preferences: Array<"push" | "email"> }>> {
  try {
    switch (type) {
      case "new_post_in_member_feed": {
        const { userId: posterId, feedId } = data as {
          userId: Id<"users">;
          feedId: Id<"feeds">;
          postId: Id<"posts">;
        };

        // Get all members of the feed except the poster
        const feedMembers = await ctx.db
          .query("userFeeds")
          .withIndex("by_org_and_feed_and_user", (q) =>
            q.eq("orgId", orgId).eq("feedId", feedId)
          )
          .collect();

        const userIds = feedMembers
          .map((m) => m.userId)
          .filter((id) => id !== posterId);

        return await userIdsToRecipients(ctx, userIds);
      }

      case "new_message_in_post": {
        const { userId: senderId, messageId } = data as {
          userId: Id<"users">;
          messageId: Id<"messages">;
          messageContent: string;
        };

        const message = await ctx.db.get(messageId);
        if (!message) return [];

        const post = await ctx.db.get(message.postId);
        if (!post) return [];

        const recipientUserIds = new Set<Id<"users">>();

        // Add post owner if not the sender
        if (post.posterId !== senderId) {
          recipientUserIds.add(post.posterId);
        }

        // Get all users who have previously messaged in this post
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_orgId_postId", (q) =>
            q.eq("orgId", orgId).eq("postId", message.postId)
          )
          .collect();

        for (const msg of messages) {
          if (msg.senderId !== senderId) {
            recipientUserIds.add(msg.senderId);
          }
        }

        return await userIdsToRecipients(ctx, Array.from(recipientUserIds));
      }

      case "new_feed_member": {
        const { userId: newMemberId, feedId } = data as {
          userId: Id<"users">;
          feedId: Id<"feeds">;
        };

        // Get all owners of the feed except the new member
        const feedOwners = await ctx.db
          .query("userFeeds")
          .withIndex("by_org_and_feed_and_user", (q) =>
            q.eq("orgId", orgId).eq("feedId", feedId)
          )
          .filter((q) => q.eq(q.field("owner"), true))
          .collect();

        const userIds = feedOwners
          .map((o) => o.userId)
          .filter((id) => id !== newMemberId);

        return await userIdsToRecipients(ctx, userIds);
      }

      default:
        return [];
    }
  } catch (error) {
    console.error("Error getting notification recipients:", error);
    return [];
  }
}

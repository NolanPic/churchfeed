import { mutation, query, QueryCtx, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserAuth } from "@/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToPlainText } from "./utils/postContentConverter";

const notificationTypeValidator = v.union(
  v.literal("new_post_in_member_feed"),
  v.literal("new_post_in_owned_feed"),
  v.literal("new_message_in_post"),
  v.literal("new_message_in_owned_post"),
  v.literal("new_feed_member"),
  v.literal("new_user_needs_approval")
);

const notificationDataValidator = v.union(
  // new_post_in_member_feed & new_post_in_owned_feed
  v.object({
    userId: v.id("users"),
    feedId: v.id("feeds"),
    postId: v.id("posts"),
  }),
  // new_message_in_post & new_message_in_owned_post
  v.object({
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
};

/**
 * Helper function to generate notification text from notification data
 * Returns default text if required entities no longer exist
 * @param ctx - Convex query context
 * @param notifications - Single notification or array of notifications
 * @returns Array of enriched notifications
 */
async function getNotificationText(
  ctx: QueryCtx,
  notifications: Doc<"notifications"> | Doc<"notifications">[]
): Promise<EnrichedNotification[]> {
  const notificationsArray = Array.isArray(notifications)
    ? notifications
    : [notifications];

  const enriched = await Promise.all(
    notificationsArray.map(async (notification): Promise<EnrichedNotification> => {
      const { type, data } = notification;

      try {
        switch (type) {
          case "new_post_in_member_feed": {
            const typedData = data as { userId: Id<"users">; feedId: Id<"feeds">; postId: Id<"posts"> };
            const user = await ctx.db.get(typedData.userId);
            const feed = await ctx.db.get(typedData.feedId);

            if (!user || !feed) {
              return {
                ...notification,
                title: "New post",
                body: "A new post was published",
              };
            }

            return {
              ...notification,
              title: "New post",
              body: `${user.name} just published a post in ${feed.name}`,
            };
          }

          case "new_post_in_owned_feed": {
            const typedData = data as { userId: Id<"users">; feedId: Id<"feeds">; postId: Id<"posts"> };
            const user = await ctx.db.get(typedData.userId);
            const feed = await ctx.db.get(typedData.feedId);

            if (!user || !feed) {
              return {
                ...notification,
                title: "New post in your feed",
                body: "A new post was published in your feed",
              };
            }

            return {
              ...notification,
              title: "New post in your feed",
              body: `${user.name} just published a post in your feed, ${feed.name}`,
            };
          }

          case "new_message_in_post": {
            const typedData = data as { messageId: Id<"messages">; messageContent: string };
            const message = await ctx.db.get(typedData.messageId);

            if (!message) {
              return {
                ...notification,
                title: "New message",
                body: "Someone responded in a post",
              };
            }

            const sender = await ctx.db.get(message.senderId);
            const messageText = fromJSONToPlainText(typedData.messageContent, 100);

            return {
              ...notification,
              title: sender ? `${sender.name} responded in a post` : "Someone responded in a post",
              body: messageText || "New message",
            };
          }

          case "new_message_in_owned_post": {
            const typedData = data as { messageId: Id<"messages">; messageContent: string };
            const message = await ctx.db.get(typedData.messageId);

            if (!message) {
              return {
                ...notification,
                title: "New message in your post",
                body: "Someone messaged in your post",
              };
            }

            const sender = await ctx.db.get(message.senderId);
            const messageText = fromJSONToPlainText(typedData.messageContent, 100);

            return {
              ...notification,
              title: sender ? `${sender.name} messaged in your post` : "Someone messaged in your post",
              body: messageText || "New message",
            };
          }

          case "new_feed_member": {
            const typedData = data as { userId: Id<"users">; feedId: Id<"feeds"> };
            const user = await ctx.db.get(typedData.userId);
            const feed = await ctx.db.get(typedData.feedId);

            if (!user || !feed) {
              return {
                ...notification,
                title: "Someone joined your feed",
                body: "A new member joined your feed",
              };
            }

            return {
              ...notification,
              title: "Someone joined your feed",
              body: `${user.name} just joined ${feed.name}`,
            };
          }

          case "new_user_needs_approval": {
            const typedData = data as { userId: Id<"users">; organizationId: Id<"organizations"> };
            const user = await ctx.db.get(typedData.userId);
            const organization = await ctx.db.get(typedData.organizationId);

            if (!user || !organization) {
              return {
                ...notification,
                title: "New user requesting to join",
                body: "Someone is requesting to join",
              };
            }

            return {
              ...notification,
              title: "New user requesting to join",
              body: `${user.name} is requesting to join ${organization.name}`,
            };
          }

          default:
            return {
              ...notification,
              title: "Notification",
              body: "",
            };
        }
      } catch (error) {
        console.error("Error enriching notification:", error);
        return {
          ...notification,
          title: "Notification",
          body: "",
        };
      }
    })
  );

  return enriched;
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

    // Enrich notifications with title and body
    const enrichedPage = await getNotificationText(ctx, result.page);

    return {
      ...result,
      page: enrichedPage,
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
      .collect();

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
      .collect();

    const now = Date.now();
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        readAt: now,
      });
    }

    return notifications.length;
  },
});

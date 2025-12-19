import { internalAction, internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { Resend } from "resend";
import {
  notificationTypeValidator,
  notificationDataValidator,
} from "./notifications";
import { fromJSONToHTML } from "./utils/postContentConverter";
import { EmailData } from "./types/notifications";
import renderEmailTemplate from "./renderEmailTemplate";

/**
 * Send email notifications to recipients
 */
export const sendEmailNotifications = internalAction({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        preferences: v.array(v.union(v.literal("push"), v.literal("email"))),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      console.error("RESEND_FROM_EMAIL environment variable not set");
      return { sent: 0, failed: recipients.length };
    }

    // Conversation lull detection for message notifications
    if (type === "new_message_in_post") {
      const messageId = (data as { messageId: Id<"messages"> }).messageId;
      const message = await ctx.runQuery(
        internal.emailNotifications.getMessage,
        { messageId },
      );

      if (!message) {
        console.error("Message not found for notification");
        return { sent: 0, failed: recipients.length };
      }

      const postId = message.postId;

      // Check for conversation lull
      const lastMessage = await ctx.runQuery(
        internal.emailNotifications.getLastMessageSentInPost,
        { postId, orgId },
      );

      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage._creationTime;
        const fifteenMinutes = 15 * 60 * 1000;

        // If less than 15 minutes since last message, reschedule
        if (timeSinceLastMessage < fifteenMinutes) {
          const remainingWait = fifteenMinutes - timeSinceLastMessage;

          await ctx.scheduler.runAfter(
            remainingWait,
            internal.emailNotifications.sendEmailNotifications,
            {
              orgId,
              type,
              data,
              recipients,
            },
          );

          return { sent: 0, failed: 0 };
        }
      }
    }

    // Fetch email data for all recipients
    const notificationData = await ctx.runQuery(
      internal.emailNotifications.getNotificationDataForEmail,
      {
        orgId,
        type,
        data,
        recipients: recipients.map((r) => ({
          userId: r.userId,
          notificationId: r.notificationId,
        })),
      },
    );

    let sent = 0;
    let failed = 0;

    // Send email to each recipient
    for (const recipientData of notificationData) {
      if (!recipientData.emailData) {
        failed++;
        continue;
      }

      try {
        const subject = generateSubjectLine(recipientData.emailData);

        let html: string;
        try {
          html = await renderEmailTemplate(recipientData.emailData);
        } catch (renderError) {
          console.error("Failed to render email template:", renderError);
          failed++;
          continue;
        }

        await resend.emails.send({
          from: fromEmail,
          to: recipientData.recipientEmail,
          subject,
          html,
        });

        sent++;
      } catch (error) {
        console.error("Failed to send email:", error);
        failed++;
      }
    }

    return { sent, failed };
  },
});

/**
 * Get notification data formatted for email templates
 */
export const getNotificationDataForEmail = internalQuery({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;

    const results = [];

    for (const recipient of recipients) {
      const user = await ctx.db.get(recipient.userId);
      if (!user || !user.email) {
        results.push({
          userId: recipient.userId,
          recipientEmail: null,
          notificationId: recipient.notificationId,
          emailData: null,
        });
        continue;
      }

      let emailData: EmailData | null = null;

      try {
        switch (type) {
          case "new_post_in_member_feed": {
            emailData = await getNewPostEmailData(
              ctx,
              orgId,
              data as {
                userId: Id<"users">;
                feedId: Id<"feeds">;
                postId: Id<"posts">;
              },
              recipient.userId,
              recipient.notificationId,
            );
            break;
          }

          case "new_message_in_post": {
            emailData = await getNewMessageEmailData(
              ctx,
              orgId,
              data as {
                userId: Id<"users">;
                messageId: Id<"messages">;
                messageContent: string;
              },
              recipient.userId,
              recipient.notificationId,
            );
            break;
          }

          case "new_feed_member": {
            emailData = await getNewFeedMemberEmailData(
              ctx,
              orgId,
              data as { userId: Id<"users">; feedId: Id<"feeds"> },
              recipient.userId,
              recipient.notificationId,
            );
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching email data:", error);
      }

      results.push({
        userId: recipient.userId,
        recipientEmail: user.email,
        notificationId: recipient.notificationId,
        emailData,
      });
    }

    return results;
  },
});

/**
 * Get a message by ID (helper for conversation lull detection)
 */
export const getMessage = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

/**
 * Get last message sent in a post for conversation lull detection
 */
export const getLastMessageSentInPost = internalQuery({
  args: {
    postId: v.id("posts"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_orgId_postId", (q) =>
        q.eq("orgId", args.orgId).eq("postId", args.postId),
      )
      .order("desc")
      .take(1);

    return messages[0] ?? null;
  },
});

/**
 * Get scheduled email notifications for a post to avoid duplicates
 */
export const getScheduledMessageNotifications = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx) => {
    const scheduled = await ctx.db.system
      .query("_scheduled_functions")
      .collect();

    return scheduled.filter((sf) => {
      if (sf.name !== "emailNotifications:sendEmailNotifications") {
        return false;
      }

      if (sf.args?.[0]?.type !== "new_message_in_post") {
        return false;
      }

      const messageId = sf.args?.[0]?.data?.messageId;
      if (!messageId) {
        return false;
      }

      return true;
    });
  },
});

// Helper functions

async function getNewPostEmailData(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  data: { userId: Id<"users">; feedId: Id<"feeds">; postId: Id<"posts"> },
  recipientUserId: Id<"users">,
  notificationId: Id<"notifications">,
): Promise<EmailData | null> {
  const author = await ctx.db.get(data.userId);
  const feed = await ctx.db.get(data.feedId);
  const post = await ctx.db.get(data.postId);

  if (!author || !feed || !post) {
    return null;
  }

  const authorImageUrl = author.image
    ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
        uploadId: author.image,
      })
    : null;
  const postHtml = fromJSONToHTML(post.content);

  // Check if recipient owns the feed
  const userFeed = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q
        .eq("orgId", orgId)
        .eq("feedId", data.feedId)
        .eq("userId", recipientUserId),
    )
    .first();

  return {
    type: "new_post_in_member_feed" as const,
    author,
    authorImageUrl,
    feed,
    postHtml,
    postId: data.postId,
    notificationId,
    userOwnsFeed: userFeed?.owner ?? false,
  };
}

async function getNewMessageEmailData(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  data: {
    userId: Id<"users">;
    messageId: Id<"messages">;
    messageContent: string;
  },
  recipientUserId: Id<"users">,
  notificationId: Id<"notifications">,
): Promise<EmailData | null> {
  const message = await ctx.db.get(data.messageId);
  if (!message) {
    return null;
  }

  // Get the most recent message and 4 before it (5 total)
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_orgId_postId", (q) =>
      q.eq("orgId", orgId).eq("postId", message.postId),
    )
    .order("desc")
    .take(5);

  const messagesWithAuthors = await Promise.all(
    messages.reverse().map(async (msg) => {
      const author = await ctx.db.get(msg.senderId);
      const authorImageUrl =
        author && author.image
          ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
              uploadId: author.image,
            })
          : null;
      const messageHtml = fromJSONToHTML(msg.content);

      return {
        message: msg,
        author: author!,
        authorImageUrl,
        messageHtml,
      };
    }),
  );

  // Get post to check ownership
  const post = await ctx.db.get(message.postId);
  const userOwnsPost = post?.posterId === recipientUserId;

  // Get most recent message author for subject line
  const mostRecentAuthor = await ctx.db.get(messages[0].senderId);

  return {
    type: "new_message_in_post" as const,
    messages: messagesWithAuthors,
    postId: message.postId,
    postTitle: "a post",
    notificationId,
    userOwnsPost,
    actorName: mostRecentAuthor?.name || "Someone",
  };
}

async function getNewFeedMemberEmailData(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  data: { userId: Id<"users">; feedId: Id<"feeds"> },
  recipientUserId: Id<"users">,
  notificationId: Id<"notifications">,
): Promise<EmailData | null> {
  const author = await ctx.db.get(data.userId);
  const feed = await ctx.db.get(data.feedId);

  if (!author || !feed) {
    return null;
  }

  const authorImageUrl = author.image
    ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
        uploadId: author.image,
      })
    : null;

  return {
    type: "new_feed_member" as const,
    author,
    authorImageUrl,
    feed,
    feedId: data.feedId,
    notificationId,
  };
}

function generateSubjectLine(emailData: EmailData): string {
  switch (emailData.type) {
    case "new_post_in_member_feed":
      if (emailData.userOwnsFeed) {
        return `${emailData.author.name} just published a post in your feed, ${emailData.feed.name}`;
      }
      return `${emailData.author.name} just published a post in ${emailData.feed.name}`;

    case "new_message_in_post":
      if (emailData.userOwnsPost) {
        return `${emailData.actorName} messaged in your post`;
      }
      return `${emailData.actorName} responded in a post`;

    case "new_feed_member":
      return `${emailData.author.name} just joined ${emailData.feed.name}`;

    default:
      return "New notification from ChurchFeed";
  }
}

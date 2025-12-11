"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  notificationDataValidator,
  notificationTypeValidator,
} from "./notifications";
import webpush from "web-push";

/**
 * Send push notifications to recipients
 * This runs in Node.js runtime to access web-push library
 */
export const sendPushNotifications = internalAction({
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

    try {
      // Configure web-push with VAPID keys
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      const vapidContactEmail = process.env.VAPID_CONTACT_EMAIL;

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys not configured");
        return { sent: 0, failed: 0 };
      }

      if (!vapidContactEmail) {
        console.error("VAPID contact email not configured");
        return { sent: 0, failed: 0 };
      }

      webpush.setVapidDetails(
        `mailto:${vapidContactEmail}`,
        vapidPublicKey,
        vapidPrivateKey,
      );

      // Get notification data for all recipients
      const notificationDataList = await ctx.runQuery(
        internal.notifications.getNotificationDataForPush,
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

      // Send to each recipient
      for (const notificationData of notificationDataList) {
        if (!notificationData.enrichedNotification) {
          console.warn(
            `Could not generate notification text for user ${notificationData.userId}`,
          );
          failed++;
          continue;
        }

        try {
          // Get user's push subscriptions
          const subscriptions = await ctx.runQuery(
            internal.notifications.getUserPushSubscriptions,
            {
              orgId,
              userId: notificationData.userId,
            },
          );

          // Send to each subscription
          for (const sub of subscriptions) {
            try {
              const payload = JSON.stringify({
                title: notificationData.enrichedNotification.title,
                body: notificationData.enrichedNotification.body,
                data: {
                  url: notificationData.enrichedNotification.action.url,
                  notificationId: notificationData.notificationId,
                },
              });

              await webpush.sendNotification(sub.subscription, payload);
              sent++;
            } catch (error) {
              // Delete subscription if it's no longer valid
              const isInvalidSubscription =
                error &&
                typeof error === "object" &&
                "statusCode" in error &&
                (error.statusCode === 404 ||
                  error.statusCode === 410 ||
                  error.statusCode === 400);

              if (isInvalidSubscription) {
                console.log(`Deleting invalid push subscription ${sub._id}`);
                await ctx.runMutation(
                  internal.notifications.deletePushSubscription,
                  { subscriptionId: sub._id },
                );
              } else {
                console.error(
                  `Error sending push notification to subscription ${sub._id}:`,
                  error,
                );
              }
              failed++;
            }
          }
        } catch (error) {
          console.error(
            `Error sending push notification to user ${notificationData.userId}:`,
            error,
          );
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error("Error in sendPushNotifications:", error);
      return { sent: 0, failed: recipients.length };
    }
  },
});

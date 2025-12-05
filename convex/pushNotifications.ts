"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import webpush from "web-push";

/**
 * Send push notifications to recipients
 * This runs in Node.js runtime to access web-push library
 */
export const sendPushNotifications = internalAction({
  args: {
    orgId: v.id("organizations"),
    type: v.string(),
    data: v.any(),
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        preferences: v.array(v.union(v.literal("push"), v.literal("email"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;

    try {
      // Configure web-push with VAPID keys
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

      if (!vapidPublicKey || !vapidPrivateKey) {
        console.error("VAPID keys not configured");
        return { sent: 0, failed: 0 };
      }

      webpush.setVapidDetails(
        "mailto:noreply@churchfeed.com",
        vapidPublicKey,
        vapidPrivateKey
      );

      // Get notification data for all recipients
      const notificationDataList = await ctx.runQuery(
        internal.notifications.getNotificationDataForPush,
        {
          orgId,
          type,
          data,
          recipientUserIds: recipients.map((r) => r.userId),
        }
      );

      let sent = 0;
      let failed = 0;

      // Send to each recipient
      for (const notificationData of notificationDataList) {
        if (!notificationData.enrichedNotification) {
          console.warn(`Could not generate notification text for user ${notificationData.userId}`);
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
            }
          );

          // Send to each subscription
          for (const sub of subscriptions) {
            try {
              const payload = JSON.stringify({
                title: notificationData.enrichedNotification.title,
                body: notificationData.enrichedNotification.body,
                url: notificationData.enrichedNotification.action.url,
                notificationId: notificationData.enrichedNotification._id,
              });

              await webpush.sendNotification(sub.subscription, payload);
              sent++;
            } catch (error: any) {
              // Delete subscription if it's no longer valid
              if (error.statusCode === 404 || error.statusCode === 410) {
                console.log(`Deleting invalid push subscription ${sub._id}`);
                await ctx.runMutation(
                  internal.notifications.deletePushSubscription,
                  { subscriptionId: sub._id }
                );
              } else {
                console.error(`Error sending push notification to subscription ${sub._id}:`, error);
              }
              failed++;
            }
          }
        } catch (error) {
          console.error(`Error sending push notification to user ${notificationData.userId}:`, error);
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

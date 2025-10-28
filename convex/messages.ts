import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";
import { fromJSONToHTML } from "./utils/postContentConverter";
import { getStorageUrl } from "./uploads";
import { internal } from "./_generated/api";

export const getForPost = query({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const post = await ctx.db.get(postId);
    if(!post) {
      throw new Error("Post not found");
    }

    const feed = await ctx.db.get(post.feedId);
    if(!feed) {
      throw new Error("Feed not found");
    }

    const auth = await getUserAuth(ctx, orgId);
    
    const isUserMemberOfThisFeedCheck = await auth.feed(post.feedId).hasRole("member");
    const feedIsPublic = feed.privacy === "public";
    const userCanViewThisPost = feedIsPublic || isUserMemberOfThisFeedCheck.allowed;

    if (!userCanViewThisPost) {
      throw new Error("User cannot view this post or its messages");
    }

    const rawMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(q.eq(q.field("orgId"), orgId), q.eq(q.field("postId"), postId))
      )
      .collect();

    // Oldest (top) to newest (bottom)
    rawMessages.sort((a, b) => a.updatedAt - b.updatedAt);

    const enriched = await Promise.all(
      rawMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        if (!sender) return null;
        const image = await getStorageUrl(ctx, sender.image);

        return {
          ...message,
          sender: { _id: sender._id, name: sender.name, image },
          content: fromJSONToHTML(message.content),
        };
      })
    );

    return enriched.filter((m) => m !== null);
  },
});

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, postId, content } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const canUserMessageCheck = await auth.feed(post.feedId).canMessage();

    if (!canUserMessageCheck.allowed) {
      throw new Error("User cannot message in this feed");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      orgId,
      postId,
      senderId: user._id,
      content,
      updatedAt: now,
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    orgId: v.id("organizations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { orgId, messageId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Get the post to check feed ownership
    const post = await ctx.db.get(message.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is the message author
    const isAuthor = message.senderId === user._id;

    // Check if user is the feed owner
    const feedOwnerCheck = await auth.feed(post.feedId).hasRole("owner");
    const isFeedOwner = feedOwnerCheck.allowed;

    // User must be either the author or the feed owner
    if (!isAuthor && !isFeedOwner) {
      throw new Error("You do not have permission to delete this message");
    }

    // Delete all uploads associated with this message
    await ctx.runMutation(internal.uploads.deleteUploadsForSource, {
      orgId,
      source: "message",
      sourceId: messageId,
    });

    // Delete the message
    await ctx.db.delete(messageId);

    return messageId;
  },
});




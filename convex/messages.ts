import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";
import { fromJSONToHTML } from "./utils/postContentConverter";

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
        const image = sender.image ? await ctx.storage.getUrl(sender.image) : null;

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




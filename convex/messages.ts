import { mutation, MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getUserAuth } from "@/lib/auth/convex";
import { fromJSONToHTML } from "./utils/postContentConverter";

export const getForPost = query({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const authCheck = auth.hasRole("user");

    // If unauthenticated, only allow access when the post's feed is public
    if (!authCheck.allowed) {
      const post = await ctx.db.get(postId);
      if (!post || post.orgId !== orgId) {
        return [];
      }
      const feed = await ctx.db.get(post.feedId);
      if (!feed || feed.privacy !== "public") {
        return [];
      }
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

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const canMessage = await auth.feed(post.feedId).canMessage();
    canMessage.throwIfNotPermitted();

    const user = auth.getUser()!;

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




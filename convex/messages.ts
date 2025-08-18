import { mutation, MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireAuth, getAuthenticatedUser } from "./user";
import { getUserFeedsWithMembershipsHelper } from "./feeds";
import { fromJSONToHTML } from "./utils/postContentConverter";

export const getForPost = query({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const user = await getAuthenticatedUser(ctx, orgId);

    // If unauthenticated, only allow access when the post's feed is public
    if (!user) {
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

    const { user } = await requireAuth(ctx, orgId);

    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const canSend = await canUserSendMessageInFeed(ctx, user, post.feedId);
    if (!canSend) {
      throw new Error("User does not have permission to message in this feed");
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

const canUserSendMessageInFeed = async (
  ctx: MutationCtx,
  user: Doc<"users">,
  feedId: Id<"feeds">
): Promise<boolean> => {
  const userFeedsWithMemberships = await getUserFeedsWithMembershipsHelper(
    ctx,
    user._id
  );

  const feed = userFeedsWithMemberships.feeds.find((f) => f._id === feedId);
  const userFeed = userFeedsWithMemberships.userFeeds.find(
    (uf) => uf.feedId === feedId
  );

  if (!feed || !userFeed) {
    return false;
  }

  return feed.memberPermissions?.includes("message") || userFeed.owner;
};



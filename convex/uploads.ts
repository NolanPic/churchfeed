import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/lib/auth/convex";

export const generateUploadUrlForUserContent = mutation({
    args: {
      orgId: v.id("organizations"),
      postId: v.optional(v.id("posts")),
      feedId: v.optional(v.id("feeds")),
    },
    handler: async (ctx, args) => {
      const { orgId, postId, feedId } = args;

      const auth = await getUserAuth(ctx, orgId);

      const userAction = postId ? "messageInPost" : "postInFeed";

      if(!feedId) {
        throw new Error("Feed id not found");
      }

      const feed = await ctx.db.get(feedId);
      if(!feed || feed.orgId !== orgId) {
        throw new Error("Feed not found");
      }

      if(postId) {
        const post = await ctx.db.get(postId);

        if(!post || post.orgId !== orgId || post.feedId !== feedId) {
          throw new Error("Post not found");
        }
      }

      // Check permissions using new auth system
      if(userAction === "messageInPost") {
        const canMessage = await auth.feed(feedId, feed).canMessage();
        canMessage.throwIfNotPermitted();
      } else if(userAction === "postInFeed") {
        const canPost = await auth.feed(feedId, feed).canPost();
        canPost.throwIfNotPermitted();
      }

      return await ctx.storage.generateUploadUrl();
    }
  });

  export const getStorageUrlForUserContent = mutation({
    args: {
        storageId: v.id("_storage"),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
      const { storageId, orgId } = args;

      const auth = await getUserAuth(ctx, orgId);
      const authCheck = auth.hasRole("user");
      authCheck.throwIfNotPermitted();

      const storageUrl = await ctx.storage.getUrl(storageId);

      if(!storageUrl) {
        throw new Error("Storage url not found");
      }

      return storageUrl;
    }
  });


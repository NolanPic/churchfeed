import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./user";
import { userPermissionsHelper } from "./feeds";
import { Id } from "./_generated/dataModel";

export const generateUploadUrlForUserContent = mutation({   
    args: {
      orgId: v.id("organizations"),
      postId: v.optional(v.id("posts")),
      feedId: v.optional(v.id("feeds")),
    },
    handler: async (ctx, args) => {
      const { orgId, postId, feedId } = args;

      const { user } = await requireAuth(ctx, orgId);

      const userAction = postId ? "messageInPost" : "postInFeed";

      if(feedId) {
        const feed = await ctx.db.get(feedId);

        if(!feed || feed.orgId !== orgId) {
          throw new Error("Feed not found");
        }
      }
      else {
        throw new Error("Feed id not found");
      }

      if(postId) {
        const post = await ctx.db.get(postId);
        
        if(!post || post.orgId !== orgId || post.feedId !== feedId) {
          throw new Error("Post not found");
        }
      }
  
      const { memberPermissions, isOwner } = await userPermissionsHelper(ctx, user, feedId);

      if(userAction === "messageInPost") {
        if(!canUserMessageInPost(memberPermissions, isOwner)) {
          throw new Error("User does not have permission to message in this post");
        }
      } else if(userAction === "postInFeed") {
        if(!canUserPostInFeed(memberPermissions, isOwner)) {
          throw new Error("User does not have permission to post in this feed");
        }
      }
  
      const uploadUrl = await ctx.storage.generateUploadUrl();
      return uploadUrl;
    }
  });

  export const getStorageUrlForUserContent = mutation({
    args: {
        storageId: v.id("_storage"),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
      const { storageId, orgId } = args;

      await requireAuth(ctx, orgId);

      const storageUrl = await ctx.storage.getUrl(storageId);
      return storageUrl;
    }
  });

  const canUserPostInFeed = (memberPermissions: string[], isOwner: boolean) => {
    return memberPermissions?.includes("post") || isOwner;
  };

  const canUserMessageInPost = (memberPermissions: string[], isOwner: boolean) => {
    return memberPermissions?.includes("message") || isOwner;
  };
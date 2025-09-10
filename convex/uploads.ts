import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./user";
import { userPermissionsHelper } from "./feeds";

export const generateUploadUrlForUserContent = mutation({   
    args: {
      orgId: v.id("organizations"),
      feedId: v.id("feeds"),
      postId: v.optional(v.id("posts")),
    },
    handler: async (ctx, args) => {
      const { orgId, feedId, postId } = args;

      const authResult = await requireAuth(ctx, orgId);
      const { user } = authResult;
  
      const feedToPostIn = feedId ? await ctx.db.get(feedId) : null;
      const postToMessageIn = postId ? await ctx.db.get(postId) : null;

      if((!feedToPostIn && !postToMessageIn) || feedToPostIn?.orgId !== orgId) {
        throw new Error("Feed or post not found");
      }
  
      const { memberPermissions, isOwner } = await userPermissionsHelper(ctx, user, feedId);

      if(postToMessageIn) {
        if(!memberPermissions?.includes("message") && !isOwner) {
          throw new Error("User does not have permission to message in this post");
        }
      } else { // user is posting in a feed
        if(!memberPermissions?.includes("post") && !isOwner) {
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
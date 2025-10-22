import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";
import { Id } from "./_generated/dataModel";

/**
 * Internal mutation to create an upload record in the database
 * Should only be called from the upload HTTP action
 */
export const createUploadRecord = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    source: v.union(v.literal("post"), v.literal("message"), v.literal("avatar")),
    sourceId: v.optional(v.union(v.id("posts"), v.id("messages"), v.id("users"))),
    fileExtension: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const uploadId = await ctx.db.insert("uploads", {
      orgId: args.orgId,
      userId: args.userId,
      storageId: args.storageId,
      source: args.source,
      sourceId: args.sourceId,
      fileExtension: args.fileExtension,
      updatedAt: now,
    });

    return uploadId;
  },
});

/**
 * Query to get storage URL for an upload with auth checks
 * Verifies user has permission to access the file
 */
export const getStorageUrl = query({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const { uploadId } = args;

    // Get the upload record
    const upload = await ctx.db.get(uploadId);
    if (!upload) {
      throw new Error("Upload not found");
    }

    // Get auth context
    const auth = await getUserAuth(ctx, upload.orgId);
    const user = auth.getUserOrThrow();

    // Check user is in the same org
    if (user.orgId !== upload.orgId) {
      throw new Error("Unauthorized: user not in same organization");
    }

    // Auth checks based on source type
    if (upload.source === "post" || upload.source === "message") {
      // Get the post/message to find the feed
      let feedId: Id<"feeds"> | null = null;

      if (upload.source === "post" && upload.sourceId) {
        const post = await ctx.db.get(upload.sourceId as Id<"posts">);
        if (!post) {
          throw new Error("Post not found");
        }
        feedId = post.feedId;
      } else if (upload.source === "message" && upload.sourceId) {
        const message = await ctx.db.get(upload.sourceId as Id<"messages">);
        if (!message) {
          throw new Error("Message not found");
        }
        const post = await ctx.db.get(message.postId);
        if (!post) {
          throw new Error("Post not found");
        }
        feedId = post.feedId;
      }

      if (!feedId) {
        throw new Error("Feed not found for upload");
      }

      // Check if user is a member of the feed (has read access)
      const feed = await ctx.db.get(feedId);
      if (!feed) {
        throw new Error("Feed not found");
      }

      // Public feeds are accessible to everyone in the org
      if (feed.privacy !== "public") {
        const memberCheck = await auth.feed(feedId, feed).hasRole("member");
        if (!memberCheck.allowed) {
          throw new Error("Unauthorized: user does not have access to this feed");
        }
      }
    }
    // For avatar uploads, just being logged in and in the same org is sufficient

    // Get the storage URL
    const url = await ctx.storage.getUrl(upload.storageId);
    if (!url) {
      throw new Error("Storage URL not found");
    }

    return {
      url,
      uploadId,
    };
  },
});

/**
 * Internal mutation to delete previous avatar uploads for a user
 * Hard-deletes the upload record and storage file
 */
export const deletePreviousAvatar = internalMutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = args;

    // Find all avatar uploads for this user
    const avatarUploads = await ctx.db
      .query("uploads")
      .withIndex("by_org_source_sourceId", (q) =>
        q.eq("orgId", orgId).eq("source", "avatar").eq("sourceId", userId),
      )
      .collect();

    // Delete each avatar upload
    for (const upload of avatarUploads) {
      // Delete the storage file
      await ctx.storage.delete(upload.storageId);
      // Delete the upload record
      await ctx.db.delete(upload._id);
    }
  },
});

/**
 * Mutation to patch upload source IDs after post/message creation
 * Updates uploadIds with the newly created source ID
 */
export const patchUploadSourceIds = mutation({
  args: {
    uploadIds: v.array(v.id("uploads")),
    sourceId: v.union(v.id("posts"), v.id("messages")),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { uploadIds, sourceId, orgId } = args;

    // Authenticate user
    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const successfullyUpdated: Id<"uploads">[] = [];

    for (const uploadId of uploadIds) {
      const upload = await ctx.db.get(uploadId);

      // Skip if upload doesn't exist
      if (!upload) {
        continue;
      }

      // Verify upload belongs to authenticated user
      if (upload.userId !== user._id) {
        continue;
      }

      // Verify upload is in the same org
      if (upload.orgId !== orgId) {
        continue;
      }

      // Update the sourceId
      await ctx.db.patch(uploadId, {
        sourceId,
        updatedAt: Date.now(),
      });

      successfullyUpdated.push(uploadId);
    }

    return successfullyUpdated;
  },
});


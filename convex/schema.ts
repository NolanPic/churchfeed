import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const defaultColumns = {
  orgId: v.id("organizations"),
  updatedAt: v.number(),
};

export default defineSchema({
  users: defineTable({
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    name: v.string(),
    image: v.optional(v.id("_storage")),
    orgId: v.id("organizations"),
    clerkId: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    role: v.optional(v.union(
      v.literal("admin"), v.literal("user")
    ))
  }).index("by_org", ["orgId"]).index("by_org_and_email", ["orgId", "email"]).index("by_clerk_and_org_id", ["clerkId", "orgId"]),
  organizations: defineTable({
    name: v.string(),
    location: v.string(),
    host: v.string(),
    updatedAt: v.number(),
  }).index("by_host", ["host"]),
  feeds: defineTable({
    ...defaultColumns,
    name: v.string(),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("open"),
    ),
    memberPermissions: v.optional(v.array(v.union(
      v.literal("post"),
      v.literal("message"),
    ))),
  }).index("by_org", ["orgId"]).index("by_org_privacy", ["orgId", "privacy"]),
  userFeeds: defineTable({
    ...defaultColumns,
    userId: v.id("users"),
    feedId: v.id("feeds"),
    owner: v.boolean(),
  })
  .index("by_user_and_feed_and_org", ["userId", "feedId", "orgId"])
  .index("by_userId", ["userId"]),
  posts: defineTable({
    ...defaultColumns,
    feedId: v.id("feeds"),
    posterId: v.id("users"),
    content: v.string(),
    postedAt: v.optional(v.number()),
  }).index("by_org_and_postedAt", ["orgId", "postedAt"]),
  messages: defineTable({
    ...defaultColumns,
    postId: v.id("posts"),
    senderId: v.id("users"),
    content: v.string(),
  }).index("by_orgId_postId", ["orgId", "postId"]),
  invites: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    token: v.optional(v.string()),
    type: v.union(
      v.literal("email"),
      v.literal("link")
    ),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    feeds: v.array(v.id("feeds")), 
  }) 
});

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
    image: v.optional(v.string()),
    orgId: v.id("organizations"),
  }).index("by_org", ["orgId"]),
  organizations: defineTable({
    name: v.string(),
    location: v.string(),
    host: v.string(),
    updatedAt: v.number(),
    settings: v.optional(v.any()),
  }).index("by_host", ["host"]),
  feeds: defineTable({
    ...defaultColumns,
    name: v.string(),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("open"),
    ),
  }).index("by_org", ["orgId"]).index("by_org_privacy", ["orgId", "privacy"]),
  userFeeds: defineTable({
    ...defaultColumns,
    userId: v.id("users"),
    feedId: v.id("feeds"),
    owner: v.boolean(),
  }),
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
  }),
});

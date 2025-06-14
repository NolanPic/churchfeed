import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const defaultColumns = {
  orgId: v.id("organizations"),
  updatedAt: v.number(),
};

export default defineSchema({
  ...authTables,
  organizations: defineTable({
    name: v.string(),
    location: v.string(),
    host: v.string(),
    updatedAt: v.number(),
  }),
  feeds: defineTable({
    ...defaultColumns,
    name: v.string(),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("open"),
    ),
  }),
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
  }).index("by_org_feed", ["orgId", "feedId"]),
  messages: defineTable({
    ...defaultColumns,
    postId: v.id("posts"),
    senderId: v.id("users"),
    content: v.string(),
  }),
});

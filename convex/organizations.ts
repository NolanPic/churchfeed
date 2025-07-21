import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrganizationBySubdomain = query({
  args: {
    subdomain: v.string(),
  },
  handler: async (ctx, { subdomain }) => {
    const host = `${subdomain}.${process.env.HOST}`;
    return await ctx.db.query("organizations")
      .withIndex("by_host", (q) => q.eq("host", host))
      .first();
  },
});

export const updateOrganizationSettings = mutation({
  args: {
    orgId: v.id("organizations"),
    settings: v.any(),
  },
  handler: async (ctx, { orgId, settings }) => {
    return await ctx.db.patch(orgId, { settings });
  },
});

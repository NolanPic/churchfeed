import { query, internalQuery } from "./_generated/server";
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

/**
 * Get an organization's host by orgId
 * Used for CORS configuration in file uploads
 */
export const getOrganizationHost = internalQuery({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { orgId }) => {
    const org = await ctx.db.get(orgId);
    return org?.host ?? null;
  },
});

/**
 * Validate if a given origin matches any organization's host
 * Used for CORS preflight validation
 */
export const validateOrigin = internalQuery({
  args: {
    origin: v.string(),
  },
  handler: async (ctx, { origin }) => {
    // The origin from the browser includes the protocol (e.g., "https://subdomain.example.com")
    // We need to extract just the host part to match against our database
    let host: string;
    try {
      const url = new URL(origin);
      host = url.host;
    } catch {
      return { valid: false, host: null };
    }

    const org = await ctx.db.query("organizations")
      .withIndex("by_host", (q) => q.eq("host", host))
      .first();

    return {
      valid: org !== null,
      host: org?.host ?? null,
    };
  },
});

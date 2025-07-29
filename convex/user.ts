import { query } from "./_generated/server";
import { v } from "convex/values";

export const doesUserExist = query({
    args: {
        email: v.string(),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query("users")
        .withIndex("by_org_and_email", (q) => q
            .eq("orgId", args.orgId)
            .eq("email", args.email))
        .first();

        return {
            userExists: !!user,
            clerkUserExists: !!user?.clerkId,
        };
    },
  });

export const getUserByClerkId = query({
    args: {
        clerkId: v.string(),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query("users")
            .withIndex("by_clerk_and_org_id", (q) => q
                .eq("clerkId", args.clerkId)
                .eq("orgId", args.orgId))
            .first();
        return user;
    },
});
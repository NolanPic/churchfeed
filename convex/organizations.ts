import { query } from "./_generated/server";

export const getOrganization = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").first();
  },
});

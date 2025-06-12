import { query } from "./_generated/server";
import { v } from "convex/values";

export const getPublicFeedPosts = query({
    args: { orgId: v.id("organizations"), feedId: v.id("feeds") },
    handler: async (cxt, args) => {
        const { orgId, feedId } = args;
        const feed = await cxt.db.get(feedId);
        if (feed?.privacy !== "public") {
            return [];
        }
        const posts = await cxt.db.query("posts")
            .withIndex("by_org_feed", 
                (q) => q.eq("orgId", orgId).eq("feedId", feedId)
            )
            .order("desc")
            .collect();

        const postsWithAuthor = await Promise.all(posts.map(async (post) => {
            const author = await cxt.db.get(post.posterId);
            return { ...post, author };
        }));

        return postsWithAuthor;
    }
});

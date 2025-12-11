import { Id } from "@/convex/_generated/dataModel";
import Feed from "../components/Feed";

export default async function App({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  let feedId: Id<"feeds"> | null = null;
  let postId: Id<"posts"> | null = null;
  let feedSettingsFeedId: Id<"feeds"> | null = null;

  if (slug && slug[0] === "feed" && slug[1]) {
    feedId = slug[1] as Id<"feeds">;
    // Check if this is a feed settings route: /feed/{feedId}/settings
    if (slug[2] === "settings") {
      feedSettingsFeedId = slug[1] as Id<"feeds">;
    }
  }
  if (slug && slug[0] === "post" && slug[1]) {
    postId = slug[1] as Id<"posts">;
  }

  return (
    <Feed
      feedIdSlug={feedId}
      postIdSlug={postId}
      feedSettingsFeedIdSlug={feedSettingsFeedId}
    />
  );
}

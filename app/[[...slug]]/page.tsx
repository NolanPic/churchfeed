import { Id } from "@/convex/_generated/dataModel";
import Feed from "../components/Feed";

export default async function App({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  let feedId: Id<"feeds"> | null = null;

  if (slug && slug[0] === "feed" && slug[1]) {
    feedId = slug[1] as Id<"feeds">;
  }

  return <Feed feedIdSlug={feedId} />;
}

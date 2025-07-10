import { preloadQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { headers } from "next/headers";
import Home from "../components/Home";
import { Id } from "@/convex/_generated/dataModel";

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

  const orgSubdomain = (await headers()).get("x-org-host") || "";

  const preloadedOrg = await preloadQuery(
    api.organizations.getOrganizationBySubdomain,
    {
      subdomain: orgSubdomain,
    }
  );

  return <Home preloadedOrg={preloadedOrg} feedId={feedId} />;
}

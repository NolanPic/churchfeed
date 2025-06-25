import { preloadQuery } from "convex/nextjs";
import { api } from "../convex/_generated/api";
import { headers } from "next/headers";
import Home from "./components/Home";

export default async function App() {
  const orgSubdomain = (await headers()).get("x-org-host") || "";

  const preloadedOrg = await preloadQuery(
    api.organizations.getOrganizationBySubdomain,
    {
      subdomain: orgSubdomain,
    }
  );

  return orgSubdomain ? (
    <Home preloadedOrg={preloadedOrg} />
  ) : (
    <div>No organization found</div>
  );
}

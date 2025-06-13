import { preloadQuery } from "convex/nextjs";
import { api } from "../convex/_generated/api";
import Home from "./components/Home";

export default async function App() {
  const preloadedOrg = await preloadQuery(api.organizations.getOrganization);

  return <Home preloadedOrg={preloadedOrg} />;
}

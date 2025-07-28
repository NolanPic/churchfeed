"use client";

import { createContext, useContext } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Preloaded } from "convex/react";

export const OrganizationContext = createContext<Doc<"organizations"> | null>(
  null
);

export function OrganizationProvider({
  children,
  organization,
}: {
  children: React.ReactNode;
  organization: Preloaded<typeof api.organizations.getOrganizationBySubdomain>;
}) {
  const org = usePreloadedQuery(organization);

  return (
    <OrganizationContext.Provider value={org}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}

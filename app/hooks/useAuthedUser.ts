"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Id } from "@/convex/_generated/dataModel";

export const useAuthedUser = () => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const org = useOrganization();
  const orgId = org?._id ?? "" as Id<"organizations">;

  const user = useQuery(api.user.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
    orgId,
  });

  return {
    user,
    clerkUser,
    organization: org,
    isSignedIn,
    isLoaded,
    signOut,
  };
};
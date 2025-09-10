"use client";

import { createContext, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CurrentFeedAndPostContext = createContext<{
  feedId: Id<"feeds"> | null;
  postId: Id<"posts"> | null;
  setFeedId: (feedId: Id<"feeds"> | null) => void;
  setPostId: (postId: Id<"posts"> | null) => void;
}>({
  feedId: null as Id<"feeds"> | null,
  postId: null as Id<"posts"> | null,
  setFeedId: () => {},
  setPostId: () => {},
});

export function CurrentFeedAndPostProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [feedId, setFeedId] = useState<Id<"feeds"> | null>(null);
  const [postId, setPostId] = useState<Id<"posts"> | null>(null);

  return (
    <CurrentFeedAndPostContext.Provider
      value={{ feedId, postId, setFeedId, setPostId }}
    >
      {children}
    </CurrentFeedAndPostContext.Provider>
  );
}

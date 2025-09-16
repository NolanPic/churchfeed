"use client";

import { createContext, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CurrentFeedAndPostContext = createContext<{
  feedId?: Id<"feeds">;
  postId?: Id<"posts">;
  setFeedId: (feedId?: Id<"feeds">) => void;
  setPostId: (postId?: Id<"posts">) => void;
}>({
  feedId: undefined as Id<"feeds"> | undefined,
  postId: undefined as Id<"posts"> | undefined,
  setFeedId: () => {},
  setPostId: () => {},
});

export function CurrentFeedAndPostProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [feedId, setFeedId] = useState<Id<"feeds">>();
  const [postId, setPostId] = useState<Id<"posts">>();

  return (
    <CurrentFeedAndPostContext.Provider
      value={{ feedId, postId, setFeedId, setPostId }}
    >
      {children}
    </CurrentFeedAndPostContext.Provider>
  );
}

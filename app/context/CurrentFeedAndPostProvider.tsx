"use client";

import { createContext, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CurrentFeedAndPostContext = createContext<{
  feedId?: Id<"feeds">;
  postId?: Id<"posts">;
  feedIdOfCurrentPost?: Id<"feeds">;
  setFeedId: (feedId?: Id<"feeds">) => void;
  setPostId: (postId?: Id<"posts">) => void;
  setFeedIdOfCurrentPost: (feedId?: Id<"feeds">) => void;
}>({
  feedId: undefined as Id<"feeds"> | undefined,
  postId: undefined as Id<"posts"> | undefined,
  feedIdOfCurrentPost: undefined as Id<"feeds"> | undefined,
  setFeedId: () => {},
  setPostId: () => {},
  setFeedIdOfCurrentPost: () => {},
});

export function CurrentFeedAndPostProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [feedId, setFeedId] = useState<Id<"feeds">>();
  const [postId, setPostId] = useState<Id<"posts">>();
  const [feedIdOfCurrentPost, setFeedIdOfCurrentPost] = useState<Id<"feeds">>();

  return (
    <CurrentFeedAndPostContext.Provider
      value={{
        feedId,
        postId,
        feedIdOfCurrentPost,
        setFeedId,
        setPostId,
        setFeedIdOfCurrentPost,
      }}
    >
      {children}
    </CurrentFeedAndPostContext.Provider>
  );
}

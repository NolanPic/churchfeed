"use client";

import { createContext, useState, ReactNode } from "react";
import { Id } from "@/convex/_generated/dataModel";

export const CurrentFeedAndThreadContext = createContext<{
  feedId?: Id<"feeds">;
  threadId?: Id<"threads">;
  feedIdOfCurrentThread?: Id<"feeds">;
  setFeedId: (feedId?: Id<"feeds">) => void;
  setThreadId: (threadId?: Id<"threads">) => void;
  setFeedIdOfCurrentThread: (feedId?: Id<"feeds">) => void;
}>({
  feedId: undefined as Id<"feeds"> | undefined,
  threadId: undefined as Id<"threads"> | undefined,
  feedIdOfCurrentThread: undefined as Id<"feeds"> | undefined,
  setFeedId: () => {},
  setThreadId: () => {},
  setFeedIdOfCurrentThread: () => {},
});

export function CurrentFeedAndThreadProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [feedId, setFeedId] = useState<Id<"feeds">>();
  const [threadId, setThreadId] = useState<Id<"threads">>();
  const [feedIdOfCurrentThread, setFeedIdOfCurrentThread] = useState<Id<"feeds">>();

  return (
    <CurrentFeedAndThreadContext.Provider
      value={{
        feedId,
        threadId,
        feedIdOfCurrentThread,
        setFeedId,
        setThreadId,
        setFeedIdOfCurrentThread,
      }}
    >
      {children}
    </CurrentFeedAndThreadContext.Provider>
  );
}

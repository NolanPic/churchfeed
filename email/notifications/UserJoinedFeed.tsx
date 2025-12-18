import { Section, Text } from "@react-email/components";
import React from "react";
import { Notification } from "./Notification";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface UserJoinedFeedProps {
  author: Doc<"users">;
  authorImageUrl: string | null;
  feed: Doc<"feeds">;
  feedId: Id<"feeds">;
  notificationId: Id<"notifications">;
}

export const UserJoinedFeed: React.FC<UserJoinedFeedProps> = ({
  author,
  authorImageUrl,
  feed,
  feedId,
}) => {
  return (
    <Notification title={`${author.name} joined your feed`}>
      <Section>
        {/* Large centered avatar */}
        <div
          style={{
            textAlign: "center" as const,
            marginBottom: "24px",
          }}
        >
          {authorImageUrl && (
            <Avatar imageUrl={authorImageUrl} size={80} />
          )}
        </div>

        {/* Joined text */}
        <Text
          style={{
            textAlign: "center" as const,
            fontSize: "18px",
            color: "#E0E0E0",
            margin: "0 0 8px 0",
            fontFamily: "Lato, Arial, sans-serif",
          }}
        >
          {author.name} joined:
        </Text>

        {/* Feed name in italic */}
        <Text
          style={{
            textAlign: "center" as const,
            fontSize: "24px",
            fontStyle: "italic",
            color: "#E0E0E0",
            margin: "0 0 32px 0",
            fontFamily: "'Gentium Plus', Georgia, serif",
          }}
        >
          {feed.name}
        </Text>

        {/* Action button */}
        <div style={{ textAlign: "center" as const }}>
          <Button url={`/feed/${feedId}`}>View feed</Button>
        </div>
      </Section>
    </Notification>
  );
};

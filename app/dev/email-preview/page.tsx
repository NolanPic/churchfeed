"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NewPost } from "@/email/notifications/NewPost";
import { NewMessages } from "@/email/notifications/NewMessages";
import { UserJoinedFeed } from "@/email/notifications/UserJoinedFeed";
import mockData from "./mockData.json";

function EmailPreviewContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  // Check if in development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>404 - Not Found</h1>
      </div>
    );
  }

  // TODO: Add admin authentication check

  if (!type) {
    return (
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Email Preview (Development Only)</h1>
        <p>Add type parameter to preview an email:</p>
        <ul>
          <li>
            <a href="?type=new_post_in_member_feed">
              ?type=new_post_in_member_feed
            </a>
          </li>
          <li>
            <a href="?type=new_message_in_post">?type=new_message_in_post</a>
          </li>
          <li>
            <a href="?type=new_feed_member">?type=new_feed_member</a>
          </li>
        </ul>
      </div>
    );
  }

  if (type === "new_post_in_member_feed") {
    const data = mockData.new_post_in_member_feed as any;
    return <NewPost {...data} />;
  }

  if (type === "new_message_in_post") {
    const data = mockData.new_message_in_post as any;
    return <NewMessages {...data} />;
  }

  if (type === "new_feed_member") {
    const data = mockData.new_feed_member as any;
    return <UserJoinedFeed {...data} />;
  }

  return (
    <div style={{ padding: "20px" }}>Unknown notification type: {type}</div>
  );
}

export default function EmailPreviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
      <EmailPreviewContent />
    </Suspense>
  );
}

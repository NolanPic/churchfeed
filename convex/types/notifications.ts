import { Id, Doc } from "../_generated/dataModel";

export type EmailData =
  | {
      type: "new_post_in_member_feed";
      author: Doc<"users">;
      authorImageUrl: string | null;
      feed: Doc<"feeds">;
      postHtml: string;
      postId: Id<"posts">;
      notificationId: Id<"notifications">;
      userOwnsFeed: boolean;
      orgHost: string;
    }
  | {
      type: "new_message_in_post";
      messages: Array<{
        message: Doc<"messages">;
        author: Doc<"users">;
        authorImageUrl: string | null;
        messageHtml: string;
      }>;
      postId: Id<"posts">;
      postTitle: string;
      notificationId: Id<"notifications">;
      userOwnsPost: boolean;
      actorName: string;
      orgHost: string;
    }
  | {
      type: "new_feed_member";
      author: Doc<"users">;
      authorImageUrl: string | null;
      feed: Doc<"feeds">;
      feedId: Id<"feeds">;
      notificationId: Id<"notifications">;
      orgHost: string;
    };

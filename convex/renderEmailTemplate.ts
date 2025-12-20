"use node";

import { render } from "@react-email/render";
import { NewPost } from "@/email/notifications/NewPost";
import { NewMessages } from "@/email/notifications/NewMessages";
import { UserJoinedFeed } from "@/email/notifications/UserJoinedFeed";
import type { ReactElement } from "react";
import { EmailData } from "./types/notifications";

export default async function renderEmailTemplate(
  emailData: EmailData,
): Promise<string> {
  let element: ReactElement;

  switch (emailData.type) {
    case "new_post_in_member_feed":
      element = NewPost({
        author: emailData.author,
        authorImageUrl: emailData.authorImageUrl,
        feed: emailData.feed,
        postHtml: emailData.postHtml,
        postId: emailData.postId,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    case "new_message_in_post":
      element = NewMessages({
        messages: emailData.messages,
        postId: emailData.postId,
        postTitle: emailData.postTitle,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    case "new_feed_member":
      element = UserJoinedFeed({
        author: emailData.author,
        authorImageUrl: emailData.authorImageUrl,
        feed: emailData.feed,
        feedId: emailData.feedId,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    default:
      throw new Error(`Unknown email type: ${(emailData as EmailData).type}`);
  }

  return await render(element);
}

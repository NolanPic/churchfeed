"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "./UserAvatar";
import MessageEditor from "./MessageEditor";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import { useOrganization } from "../context/OrganizationProvider";
import styles from "./MessageThread.module.css";
import { getTimeAgoLabel } from "./ui-utils";
import classNames from "classnames";
import Hint from "./common/Hint";

export default function MessageThread({ postId }: { postId: Id<"posts"> }) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const post = useQuery(api.posts.getById, {
    orgId,
    postId,
  });
  const messages = useQuery(api.messages.getForPost, { orgId, postId });
  const { isSignedIn, user, feeds } = useAuthedUser();
  const memberFeed = feeds.find((f) => f._id === post?.feedId);

  const canSendMessage =
    isSignedIn &&
    memberFeed &&
    (memberFeed.owner || post?.feed?.memberPermissions?.includes("message"));

  return (
    <>
      {messages?.length ? (
        <div className={styles.messages}>
          {messages?.map((m) => {
            const postedAt = m?._creationTime;
            const timeAgoLabel = getTimeAgoLabel(postedAt);
            return (
              <ol
                className={classNames(styles.message, {
                  [styles.messageSelf]: m.sender._id === user?._id,
                })}
                key={m._id}
              >
                <li>
                  <article>
                    <UserAvatar user={m.sender} size={34} />
                    <div className={styles.messageBubble}>
                      <header>{m.sender.name}</header>
                      <div
                        className={styles.messageContent}
                        dangerouslySetInnerHTML={{ __html: m.content }}
                      />
                    </div>
                  </article>
                  <span className={styles.messageTimestamp}>
                    {timeAgoLabel}
                  </span>
                </li>
              </ol>
            );
          })}
        </div>
      ) : (
        canSendMessage && (
          <Hint type="info">
            This post has no messages yet. Be the first to send one!
          </Hint>
        )
      )}

      {canSendMessage ? (
        <div className={styles.messageEditorWrapper}>
          <MessageEditor postId={postId} />
        </div>
      ) : (
        <Hint type="warn">
          You don't have permission to send messages in this feed.
        </Hint>
      )}
    </>
  );
}

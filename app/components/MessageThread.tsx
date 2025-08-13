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

export default function MessageThread({ postId }: { postId: Id<"posts"> }) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const messages = useQuery(api.messages.getForPost, { orgId, postId });
  const { isSignedIn, user } = useAuthedUser();

  return (
    <>
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
                <span className={styles.messageTimestamp}>{timeAgoLabel}</span>
              </li>
            </ol>
          );
        })}
      </div>
      <div className={styles.messageEditorWrapper}>
        <MessageEditor
          postId={postId}
          disabledHint={!isSignedIn ? "Sign in to send messages" : undefined}
        />
      </div>
    </>
  );
}

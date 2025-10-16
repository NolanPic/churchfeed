"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "./UserAvatar";
import MessageEditor from "./editor/MessageEditor";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useOrganization } from "../context/OrganizationProvider";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import styles from "./MessageThread.module.css";
import userContentStyles from "./shared-styles/user-content.module.css";
import { getTimeAgoLabel } from "../utils/ui-utils";
import classNames from "classnames";
import Hint from "./common/Hint";
import SanitizedUserContent from "./common/SanitizedUserContent";
import Link from "next/link";
import { motion, useMotionValue, animate } from "motion/react";
import { useState, useEffect } from "react";

export default function MessageThread({ postId }: { postId: Id<"posts"> }) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const post = useQuery(api.posts.getById, {
    orgId,
    postId,
  });
  const messages = useQuery(api.messages.getForPost, { orgId, postId });
  const [auth, { isLoading: isUserLoaded, user }] = useUserAuth();
  const [canSendMessage, setCanSendMessage] = useState(false);

  const isSignedIn = auth !== null;

  // Check if user can send message using new auth system
  useEffect(() => {
    if (!auth || !post?.feedId) {
      setCanSendMessage(false);
      return;
    }

    auth.feed(post.feedId).canMessage().then((result) => {
      setCanSendMessage(result.allowed);
    });
  }, [auth, post?.feedId]);

  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");
  const doAnimateTimeStampRevealOnPhone = !isTabletOrUp;
  const x = useMotionValue(0);

  if (messages === undefined) {
    return <p>Loading messages...</p>;
  }

  return (
    <>
      {messages?.length > 0 && (
        <div className={styles.messagesContainer}>
          <motion.ol
            className={styles.messages}
            drag={doAnimateTimeStampRevealOnPhone ? "x" : false}
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.01}
            dragMomentum={false}
            style={{ x }}
            onDragEnd={() => {
              animate(x, 0, {
                type: "spring",
                stiffness: 400,
                damping: 30,
              });
            }}
          >
            {messages?.map((m) => {
              const postedAt = m?._creationTime;
              const timeAgoLabel = getTimeAgoLabel(postedAt);
              return (
                <li
                  className={classNames(styles.message, {
                    [styles.messageSelf]: m.sender._id === user?._id,
                  })}
                  key={m._id}
                >
                  <article>
                    <div className={styles.messageAvatar}>
                      <UserAvatar
                        user={m.sender}
                        size={isTabletOrUp ? 34 : 24}
                      />
                    </div>
                    <div className={styles.messageBubble}>
                      <header>{m.sender.name}</header>
                      <SanitizedUserContent
                        className={classNames(
                          styles.messageContent,
                          userContentStyles.userContent
                        )}
                        html={m.content}
                      />
                    </div>
                  </article>
                  <span className={styles.messageTimestamp}>
                    {timeAgoLabel}
                  </span>
                </li>
              );
            })}
          </motion.ol>
        </div>
      )}
      {!isSignedIn ? (
        <Hint type="info" className={styles.hint}>
          <p>
            You can <Link href="/login">sign in</Link> to send messages.
          </p>
        </Hint>
      ) : !canSendMessage && isUserLoaded ? (
        <Hint type="info" className={styles.hint}>
          <p>You don&apos;t have permission to send messages in this feed.</p>
        </Hint>
      ) : (
        <div className={styles.messageEditorWrapper}>
          <MessageEditor postId={postId} />
        </div>
      )}
    </>
  );
}

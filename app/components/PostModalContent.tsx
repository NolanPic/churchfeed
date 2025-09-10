"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import UserAvatar from "./UserAvatar";
import { getTimeAgoLabel } from "./ui-utils";
import styles from "./PostModalContent.module.css";
import userContentStyles from "./shared-styles/user-content.module.css";
import { useOrganization } from "../context/OrganizationProvider";
import MessageThread from "./MessageThread";
import SanitizedUserContent from "./common/SanitizedUserContent";
import classNames from "classnames";

export default function PostModal({ postId }: { postId: Id<"posts"> }) {
  const org = useOrganization();
  const post = useQuery(
    api.posts.getById,
    org?._id ? { orgId: org._id, postId } : "skip"
  );

  const postedAt = post?.postedAt ?? post?._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <div>
      <div className={styles.post}>
        <div className={styles.postAuthorAvatar}>
          <UserAvatar user={post.author} size={34} />
        </div>
        <div className={styles.postRight}>
          <p className={styles.postInfo}>
            <span className={styles.postAuthorName}>{post.author?.name}</span>
            <span className={styles.postTimeAndSourceFeed}>
              {timeAgoLabel}
              {post.feed ? ` in ${post.feed.name}` : ""}
            </span>
          </p>
          <SanitizedUserContent
            className={classNames(
              styles.postContent,
              userContentStyles.userContent
            )}
            html={post.content}
          />
        </div>
      </div>
      <hr className={styles.postSeparator} />
      <MessageThread postId={post._id} />
    </div>
  );
}

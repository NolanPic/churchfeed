"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Modal from "./common/Modal";
import UserAvatar from "./UserAvatar";
import { getTimeAgoLabel } from "./ui-utils";
import styles from "./PostModal.module.css";
import { useOrganization } from "../context/OrganizationProvider";
import MessageThread from "./MessageThread";

export default function PostModal({
  postId,
  onClose,
}: {
  postId: Id<"posts">;
  onClose: () => void;
}) {
  const org = useOrganization();
  const post = useQuery(api.posts.getById, {
    orgId: org?._id as Id<"organizations">,
    postId,
  });

  const postedAt = post?.postedAt ?? post?._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);

  return (
    <Modal
      isOpen={!!post}
      onClose={onClose}
      ariaLabel="Post details and messages"
    >
      {post && (
        <div>
          <div className={styles.post}>
            <div className={styles.postAuthorAvatar}>
              <UserAvatar user={post.author} size={34} />
            </div>
            <div className={styles.postRight}>
              <p className={styles.postInfo}>
                <span className={styles.postAuthorName}>
                  {post.author?.name}
                </span>
                <span className={styles.postTimeAndSourceFeed}>
                  {timeAgoLabel}
                  {post.feed ? ` in ${post.feed.name}` : ""}
                </span>
              </p>
              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>
          <hr className={styles.postSeparator} />
          <MessageThread postId={post._id} />
        </div>
      )}
    </Modal>
  );
}

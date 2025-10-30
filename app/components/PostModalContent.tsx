"use client";

import { useContext, useEffect } from "react";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./PostModalContent.module.css";
import { useOrganization } from "../context/OrganizationProvider";
import MessageThread from "./MessageThread";
import Post from "./Post";

export default function PostModal({
  postId,
  onClose,
}: {
  postId: Id<"posts">;
  onClose: () => void;
}) {
  const org = useOrganization();
  const { setFeedIdOfCurrentPost } = useContext(CurrentFeedAndPostContext);
  const post = useQuery(
    api.posts.getById,
    org?._id ? { orgId: org._id, postId } : "skip",
  );

  useEffect(() => {
    setFeedIdOfCurrentPost(post?.feedId);
  }, [post, setFeedIdOfCurrentPost]);

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <div>
      <div className={styles.postWrapper}>
        <Post
          post={post}
          variant="postDetails"
          showSourceFeed
          onPostDeleted={onClose}
        />
      </div>
      <hr className={styles.postSeparator} />
      <MessageThread postId={post._id} />
    </div>
  );
}

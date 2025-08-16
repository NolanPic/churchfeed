import styles from "./FeedPost.module.css";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getTimeAgoLabel } from "./ui-utils";
import UserAvatar from "./UserAvatar";
import SanitizedUserContent from "./common/SanitizedUserContent";

interface FeedPostProps {
  post: Doc<"posts"> & {
    author: Omit<Doc<"users">, "image"> & { image: string | null };
  } & {
    feed: Doc<"feeds"> | null;
    messageCount: number;
  };
  showSourceFeed: boolean;
  onOpenPost?: (postId: Id<"posts">) => void;
}
export default function FeedPost({
  post,
  showSourceFeed,
  onOpenPost,
}: FeedPostProps) {
  const { _id, content } = post;

  const postedAt = post.postedAt ?? post._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);

  const getTimeAndSourceFeed = () => {
    if (showSourceFeed) {
      return (
        <>
          {timeAgoLabel}
          {" in  "}
          <Link href={`/feed/${post.feed?._id}`}>{post.feed?.name}</Link>
        </>
      );
    }
    return timeAgoLabel;
  };

  const messageCount =
    post.messageCount > 0
      ? post.messageCount > 99
        ? "99+"
        : post.messageCount
      : null;

  return (
    <>
      <article key={_id} className={styles.feedPost}>
        <div className={styles.postAuthorAvatar}>
          <UserAvatar user={post.author} size={34} />
        </div>
        <div className={styles.postRight}>
          <div className={styles.postInfo}>
            <span className={styles.postAuthorName}>{post.author?.name}</span>
            <span
              className={styles.postTimeAndSourceFeed}
              title={`Posted ${timeAgoLabel} in ${post.feed?.name}`}
            >
              {getTimeAndSourceFeed()}
            </span>
            <button
              className={styles.postMessageThread}
              onClick={() => onOpenPost?.(post._id)}
            >
              {messageCount && (
                <span className={styles.postMessageThreadCount}>
                  {messageCount}
                </span>
              )}
              <Image
                className={styles.postMessageThreadIcon}
                src="/icons/messages.svg"
                alt="View message thread"
                width={20}
                height={20}
              />
            </button>
          </div>
          <SanitizedUserContent className={styles.postContent} html={content} />
        </div>
      </article>
    </>
  );
}

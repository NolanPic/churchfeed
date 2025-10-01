import styles from "./Post.module.css";
import userContentStyles from "./shared-styles/user-content.module.css";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getTimeAgoLabel } from "../utils/ui-utils";
import UserAvatar from "./UserAvatar";
import SanitizedUserContent from "./common/SanitizedUserContent";
import classNames from "classnames";

interface PostProps {
  post: Doc<"posts"> & {
    author: Omit<Doc<"users">, "image"> & { image: string | null };
  } & {
    feed: Doc<"feeds"> | null;
    messageCount?: number;
  };
  variant: "feed" | "postDetails";
  showSourceFeed: boolean;
  onOpenPost?: (postId: Id<"posts">) => void;
}

export default function Post({
  post,
  variant,
  showSourceFeed,
  onOpenPost,
}: PostProps) {
  const { _id, content } = post;

  const postedAt = post.postedAt ?? post._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);
  const postedInLink = post.feed ? (
    <Link href={`/feed/${post.feed._id}`}>{post.feed.name}</Link>
  ) : null;

  const getTimeAndSourceFeed = () => {
    if (showSourceFeed && post.feed) {
      return (
        <>
          {timeAgoLabel}
          <span className={styles.postedIn_tabletUp}>
            {" in "}
            {postedInLink}
          </span>
        </>
      );
    }
    return timeAgoLabel;
  };

  const messageCount =
    variant === "feed" && post.messageCount && post.messageCount > 0
      ? post.messageCount > 99
        ? "99+"
        : post.messageCount
      : null;

  return (
    <article key={_id} className={styles.postWrapper}>
      <div className={styles.post}>
        <div className={styles.authorAvatar}>
          <UserAvatar user={post.author} />
        </div>
        <p className={styles.authorName}>{post.author?.name}</p>
        <p
          className={styles.metadata}
          title={`Posted ${timeAgoLabel}${post.feed ? ` in ${post.feed.name}` : ""}`}
        >
          {getTimeAndSourceFeed()}
        </p>
        {variant === "feed" && (
          <button
            className={styles.messageThreadButton}
            onClick={() => onOpenPost?.(post._id)}
          >
            {messageCount && (
              <span className={styles.messageThreadCount}>{messageCount}</span>
            )}
            <Image
              className={styles.messageThreadIcon}
              src="/icons/messages.svg"
              alt="View message thread"
              width={20}
              height={20}
            />
          </button>
        )}
        <SanitizedUserContent
          className={classNames(styles.content, userContentStyles.userContent)}
          html={content}
        />
      </div>

      {showSourceFeed && post.feed && (
        <p className={styles.postedIn}>Posted in {postedInLink}</p>
      )}
    </article>
  );
}

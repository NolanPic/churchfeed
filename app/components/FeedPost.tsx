import styles from "./FeedPost.module.css";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getTimeAgoLabel } from "./ui-utils";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import UserAvatar from "./UserAvatar";

interface FeedPostProps {
  post: Doc<"posts"> & {
    author: Omit<Doc<"users">, "image"> & { image: string | null };
  } & {
    feed: Doc<"feeds"> | null;
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
  const user = useAuthedUser();

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

  return (
    <>
      <article key={_id} className={styles.feedPost}>
        <div className={styles.postAuthorAvatar}>
          <UserAvatar user={post.author} size={34} />
        </div>
        <div className={styles.postRight}>
          <p className={styles.postInfo}>
            <span className={styles.postAuthorName}>{post.author?.name}</span>
            <span
              className={styles.postTimeAndSourceFeed}
              title={`Posted ${timeAgoLabel} in ${post.feed?.name}`}
            >
              {getTimeAndSourceFeed()}
            </span>

            {user?.isSignedIn && (
              <Image
                className={styles.postMessageThread}
                src="/icons/messages.svg"
                alt="View message thread"
                width={20}
                height={20}
                onClick={() => onOpenPost?.(post._id)}
              />
            )}
          </p>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </article>
    </>
  );
}

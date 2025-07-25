import DOMPurify from "dompurify";
import styles from "./FeedPost.module.css";
import { Doc } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getFormattedTimestamp } from "./ui-utils";

// TODO: move to backend e.g. sanitize before saving to db
const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "ul",
      "li",
      "ol",
      "a",
      "img",
      "iframe",
    ],
    ALLOWED_ATTR: ["href", "target", "src", "width", "height"],
  });
};

const getAuthorInitialsAvatar = (authorName?: string) => {
  const initials = authorName
    ?.split(" ")
    .map((name) => name[0])
    .join("");
  return initials;
};

interface FeedPostProps {
  post: Doc<"posts"> & { author: Doc<"users"> | null } & {
    feed: Doc<"feeds"> | null;
  };
  showSourceFeed: boolean;
}
export default function FeedPost({ post, showSourceFeed }: FeedPostProps) {
  const { _id, content } = post;

  const timestamp =
    getFormattedTimestamp(post.postedAt ?? post._creationTime) + " ago";

  const getTimeAndSourceFeed = () => {
    if (showSourceFeed) {
      return (
        <>
          {timestamp}
          {" in  "}
          <Link href={`/feed/${post.feed?._id}`}>{post.feed?.name}</Link>
        </>
      );
    }
    return timestamp;
  };

  return (
    <>
      <article key={_id} className={styles.feedPost}>
        <div className={styles.postAuthorAvatar}>
          {getAuthorInitialsAvatar(post.author?.name)}
        </div>
        <div className={styles.postRight}>
          <p className={styles.postInfo}>
            <span className={styles.postAuthorName}>{post.author?.name}</span>
            <span
              className={styles.postTimeAndSourceFeed}
              title={`Posted ${timestamp} in ${post.feed?.name}`}
            >
              {getTimeAndSourceFeed()}
            </span>

            <Image
              className={styles.postMessageThread}
              src="/icons/messages.svg"
              alt="View message thread"
              width={20}
              height={20}
            />
          </p>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        </div>
      </article>
    </>
  );
}

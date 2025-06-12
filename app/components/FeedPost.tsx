import DOMPurify from "dompurify";
import styles from "./FeedPost.module.css";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";


// TODO: move to backend e.g. sanitize before saving to db
const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "li", "ol", "a", "img"],
      ALLOWED_ATTR: ["href", "target", "src", "width", "height"],
    });
  };


const getAuthorInitialsAvatar = (authorName?: string) => {
    const initials = authorName?.split(" ").map(name => name[0]).join("");
    return initials;
}

const getFormattedTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

interface FeedPostProps {
    post: Doc<"posts"> & { author: Doc<"users"> | null };
}
export default function FeedPost({ post }: FeedPostProps) {
    const { _id, content } = post;

    return (
        <>
            <article key={_id} className={styles.feedPost}>
                <div className={styles.postAuthorAvatar}>{getAuthorInitialsAvatar(post.author?.name)}</div>
                <div className={styles.postRight}>
                    <div className={styles.postInfo}>
                        <div className={styles.postAuthorName}>{post.author?.name}</div>
                        <div className={styles.postTimestamp}>{getFormattedTimestamp(post._creationTime)}</div>
                        <img className={styles.postMessageThread} src="/icons/messages.svg" alt="View message thread" />
                    </div>
                    <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
                </div>
            </article>
            <hr className={styles.postSeparator} />
        </>
    );
}
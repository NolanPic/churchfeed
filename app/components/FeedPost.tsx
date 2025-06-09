import DOMPurify from "dompurify";
import styles from "./FeedPost.module.css";
import { Doc } from "@/convex/_generated/dataModel";

// TODO: move to backend e.g. sanitize before saving to db
const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "li", "ol", "a", "img"],
      ALLOWED_ATTR: ["href", "target", "src", "width", "height"],
    });
  };

interface FeedPostProps {
    post: Doc<"posts">;
}
export default function FeedPost({ post }: FeedPostProps) {
    const { _id, content } = post;
    return (
        <article key={_id} className={styles.feedPost}>
            <div className={styles.feedPostContent} dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
        </article>
    );
}
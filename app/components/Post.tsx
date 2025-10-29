import styles from "./Post.module.css";
import userContentStyles from "./shared-styles/user-content.module.css";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getTimeAgoLabel } from "../utils/ui-utils";
import UserAvatar from "./UserAvatar";
import SanitizedUserContent from "./common/SanitizedUserContent";
import classNames from "classnames";
import { useState, useEffect, useRef } from "react";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "../context/OrganizationProvider";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./common/Button";

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
  onPostDeleted?: () => void;
}

export default function Post({
  post,
  variant,
  showSourceFeed,
  onOpenPost,
  onPostDeleted,
}: PostProps) {
  const { _id, content } = post;
  const [auth] = useUserAuth();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const deletePost = useMutation(api.posts.deletePost);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const postedAt = post.postedAt ?? post._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);
  const postedInLink = post.feed ? (
    <Link href={`/feed/${post.feed._id}`}>{post.feed.name}</Link>
  ) : null;

  // Check if user can delete this post
  useEffect(() => {
    if (!auth || !post.feed) {
      setCanDelete(false);
      return;
    }

    const user = auth.getUser();
    if (!user) {
      setCanDelete(false);
      return;
    }

    // User can delete if they're the author or a feed owner
    const isAuthor = post.posterId === user._id;

    auth
      .feed(post.feed._id)
      .hasRole("owner")
      .then((result) => {
        setCanDelete(isAuthor || result.allowed);
      });
  }, [auth, post.posterId, post.feed]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      onPostDeleted?.();

      // Hack: wait for the navigation/modal close animation to complete
      // before deleting the post to avoid query errors
      await new Promise((resolve) => setTimeout(resolve, 300));

      await deletePost({ orgId, postId: _id });
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

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
        {canDelete && (
          <div
            className={styles.postMenu}
            ref={menuRef}
            data-menu-open={isMenuOpen}
          >
            <Button
              icon="ellipsis"
              ariaLabel="Post options"
              iconSize={20}
              className={styles.postMenuButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              noBackground
            />
            <AnimatePresence>
              {isMenuOpen && (
                <motion.ul
                  className={styles.postMenuList}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <li className={styles.postMenuItem}>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleDeletePost();
                      }}
                    >
                      Delete post
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
        {variant === "feed" && (
          <button
            className={styles.messageThreadButton}
            type="button"
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

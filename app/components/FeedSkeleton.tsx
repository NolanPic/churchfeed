import styles from "./FeedSkeleton.module.css";

export default function FeedSkeleton() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <article key={i} className={styles.skeletonPostWrapper}>
          <div className={styles.skeletonFeedPost}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonPostRight}>
              <div className={styles.skeletonPostInfo}>
                <div className={styles.skeletonAuthorName} />
                <div className={styles.skeletonTimestamp} />
                <div className={styles.skeletonMessageThread} />
              </div>
              <div className={styles.skeletonContentLine1} />
              <div className={styles.skeletonContentLine2} />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

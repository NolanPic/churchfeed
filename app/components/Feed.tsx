import styles from "./Feed.module.css";
import FeedSelector from "./FeedSelector";

export default function Feed() {
  return (
    <main>
      <div className={styles.feedSelectorWrapper}>
        <FeedSelector />
      </div>
      <div className={styles.feedWrapper}>
        <h2 className={styles.feedIntro}>What&apos;s happening?</h2>
        <hr className={styles.feedIntroRule} />

        <p>asdf</p>
      </div>
    </main>
  );
}

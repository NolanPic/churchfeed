import styles from "./FeedSelector.module.css";

export default function FeedSelector() {
  return (
    <nav className={styles.feedSelector}>
      <span className={styles.feedSelectorText}>All feeds</span>
      <img
        className={styles.dropdownArrow}
        src="/icons/dropdown-arrow.svg"
        alt="Expand feed selector"
      />
    </nav>
  );
}

import { useEffect } from "react";
import styles from "./Backdrop.module.css";

export default function Backdrop({ onClick }: { onClick: () => void }) {
  useEffect(() => {
    const setOverflow = (overflow: string) => {
      [document.documentElement, document.body].forEach(
        (container) => (container.style.overflow = overflow)
      );
    };

    setOverflow("hidden");

    return () => {
      setOverflow("auto");
    };
  }, []);

  return <div className={styles.backdrop} onClick={onClick}></div>;
}

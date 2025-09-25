import { useEffect } from "react";
import styles from "./Backdrop.module.css";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      className={styles.backdrop}
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    ></motion.div>
  );
}

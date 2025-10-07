"use client";
import { useLockBodyScroll } from "@/app/hooks/useLockBodyScroll";
import styles from "./Backdrop.module.css";
import { motion } from "framer-motion";

export default function Backdrop({ onClick }: { onClick: () => void }) {
  useLockBodyScroll(true);

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

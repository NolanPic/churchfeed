"use client";

import { ReactNode, useEffect } from "react";
import Backdrop from "./Backdrop";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./Modal.module.css";
import Icon from "./Icon";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  ariaLabel,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className={styles.modalWrapper}
          >
            <motion.div className={styles.modalCard}>
              <button
                aria-label="Close"
                className={styles.closeButton}
                onClick={onClose}
              >
                <Icon name="close" size={24} />
              </button>
              {children}
            </motion.div>
          </motion.div>
          <Backdrop onClick={onClose} />
        </>
      )}
    </AnimatePresence>
  );
}

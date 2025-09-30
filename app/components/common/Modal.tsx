"use client";

import { ReactNode, useEffect } from "react";
import {
  motion,
  useAnimate,
  useDragControls,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import styles from "./Modal.module.css";
import Icon from "./Icon";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
  closeMethodOnPhone?: "handle" | "button";
}

export default function Modal({
  isOpen,
  onClose,
  children,
  ariaLabel,
  closeMethodOnPhone = "handle",
}: ModalProps) {
  const [scope, animate] = useAnimate();
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");
  const doAnimateDragToCloseOnPhone =
    !isTabletOrUp && closeMethodOnPhone === "handle";

  const handleClose = async () => {
    if (doAnimateDragToCloseOnPhone) {
      const currentY = typeof y.get() === "number" ? y.get() : 0;
      const offscreen =
        typeof window !== "undefined" ? window.innerHeight : 500;
      await animate("#modal", { y: [currentY, offscreen] });
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Ensure drag position is reset when opening/closing
  useEffect(() => {
    if (isTabletOrUp) return;
    if (isOpen) {
      y.set(0);
      animate("#modal", { y: 0 }, { duration: 0 });
    } else {
      y.set(0);
    }
  }, [isOpen]);

  const modal = isOpen ? (
    <motion.div
      ref={scope}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ duration: 0.2 }}
      className={styles.modalWrapper}
    >
      <motion.div
        id="modal"
        className={styles.modal}
        style={{ y }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={() => {
          if (y.get() >= 100) {
            handleClose();
          } else {
            animate("#modal", { y: [y.get(), 0] });
          }
        }}
      >
        <button
          aria-label="Drag to close"
          className={styles.handleBar_PhoneOnly}
          onPointerDown={(e) => {
            dragControls.start(e);
          }}
        ></button>
        <button
          aria-label="Close"
          className={styles.closeButton_TabletUp}
          onClick={handleClose}
        >
          <Icon name="close" size={24} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  ) : null;

  return doAnimateDragToCloseOnPhone ? (
    modal
  ) : (
    <AnimatePresence>{modal}</AnimatePresence>
  );
}

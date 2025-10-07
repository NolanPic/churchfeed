"use client";

import { ReactNode, useEffect, useCallback, useId } from "react";
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
import { useLockBodyScroll } from "@/app/hooks/useLockBodyScroll";

interface ModalToolbarProps {
  onClose: () => void;
}
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  ariaLabel?: string;
  dragToClose?: boolean;
  toolbar?: (props: ModalToolbarProps) => React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  ariaLabel,
  dragToClose = false,
  toolbar,
}: ModalProps) {
  const [scope, animate] = useAnimate();
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");
  const doAnimateDragToCloseOnPhone = !isTabletOrUp && dragToClose;

  useLockBodyScroll(isOpen);

  const handleClose = useCallback(async () => {
    if (doAnimateDragToCloseOnPhone) {
      const currentY = typeof y.get() === "number" ? y.get() : 0;
      const offscreen =
        typeof window !== "undefined" ? window.innerHeight : 500;
      await animate("#modal", { y: [currentY, offscreen] });
    }
    onClose();
  }, [doAnimateDragToCloseOnPhone, y, animate, onClose]);

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
  }, [isOpen, animate, isTabletOrUp, y]);

  const titleId = useId();

  const modal = isOpen ? (
    <motion.div
      ref={scope}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={title && !ariaLabel ? titleId : undefined}
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
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={() => {
          if (y.get() >= 175) {
            handleClose();
          } else {
            animate("#modal", { y: [y.get(), 0] });
          }
        }}
      >
        {dragToClose && (
          <button
            aria-label="Drag to close"
            className={styles.handleBar_PhoneOnly}
            onPointerDown={(e) => {
              dragControls.start(e);
            }}
          ></button>
        )}
        <button
          aria-label="Close"
          className={styles.closeButton_TabletUp}
          onClick={handleClose}
        >
          <Icon name="close" size={24} />
        </button>
        {title && (
          <>
            <h1 className={styles.title} id={titleId}>
              {title}
            </h1>
            <hr className={styles.titleSeparator} />
          </>
        )}
        {children}
      </motion.div>
      {toolbar && (
        <div className={styles.toolbar}>
          {toolbar({ onClose: handleClose })}
        </div>
      )}
    </motion.div>
  ) : null;

  return doAnimateDragToCloseOnPhone ? (
    modal
  ) : (
    <AnimatePresence>{modal}</AnimatePresence>
  );
}

"use client";

import styles from "./NewPostButton.module.css";
import Icon from "../common/Icon";
import classNames from "classnames";
import { motion, useAnimation } from "motion/react";
import { useEffect, useState } from "react";

interface NewPostButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function NewPostButton({ isOpen, onClick }: NewPostButtonProps) {
  const icon = isOpen ? "close" : "plus";
  const [isHovered, setIsHovered] = useState(false);

  const buttonAnimation = useAnimation();
  const buttonTextAnimation = useAnimation();

  useEffect(() => {
    // When the editor is opened, clear hover so it doesn't persist
    // and cause the label to flash when closing back to the plus state.
    if (isOpen && isHovered) {
      setIsHovered(false);
    }

    if (!isOpen && isHovered) {
      buttonAnimation.start({ width: "120px", top: "50px" });
      buttonTextAnimation.start({ opacity: 1, display: "block" });
    } else if (isOpen) {
      buttonAnimation.start({ width: "30px", top: 0 });
      buttonTextAnimation.start({ opacity: 0, display: "none" });
    } else {
      buttonAnimation.start({ width: "30px", top: "50px" });
      buttonTextAnimation.start({ opacity: 0, display: "none" });
    }
  }, [isOpen, isHovered]);

  return (
    <motion.button
      aria-label="New post"
      className={classNames(
        styles.newPostButton,
        isOpen && styles.newPostButtonOpen
      )}
      onClick={onClick}
      style={isOpen ? { zIndex: 3 } : {}}
      onHoverStart={() => {
        if (!isOpen) setIsHovered(true);
      }}
      onHoverEnd={() => setIsHovered(false)}
      animate={buttonAnimation}
      transition={{
        width: {
          type: "spring",
          stiffness: 250,
          damping: 20,
          duration: 0.2,
        },
        top: {
          duration: 0.1,
        },
      }}
    >
      <Icon name={icon} size={18} className={styles.newPostButtonIcon} />

      {!isOpen && (
        <motion.span
          className={styles.newPostButtonText}
          initial={{ display: "none" }}
          animate={{
            display: isHovered ? "block" : "none",
            opacity: isHovered ? 1 : 0,
          }}
        >
          New post
        </motion.span>
      )}
    </motion.button>
  );
}

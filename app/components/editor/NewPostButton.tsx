"use client";

import styles from "./NewPostButton.module.css";
import Icon from "../common/Icon";
import classNames from "classnames";

interface NewPostButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export default function NewPostButton({ isOpen, onClick }: NewPostButtonProps) {
  const icon = isOpen ? "close" : "plus";

  return (
    <button
      aria-label="New post"
      className={classNames(
        styles.newPostButton,
        isOpen && styles.newPostButtonOpen
      )}
      onClick={onClick}
      style={isOpen ? { zIndex: 3 } : {}}
    >
      <Icon name={icon} size={18} className={styles.newPostButtonIcon} />
      <span className={styles.newPostButtonText}>New post</span>
    </button>
  );
}

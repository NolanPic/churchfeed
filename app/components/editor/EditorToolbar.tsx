"use client";

import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";
import { ReactNode } from "react";

interface EditorToolbarProps {
  actionButton: {
    label: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  };
  leftSlot?: ReactNode;
}

export default function EditorToolbar({
  actionButton,
  leftSlot,
}: EditorToolbarProps) {
  return (
    <div className={styles.postEditorToolbar}>
      {leftSlot}
      <Button
        icon={actionButton.icon}
        onClick={actionButton.onClick}
        disabled={actionButton.disabled}
        className={actionButton.className ?? styles.postButton}
      >
        {actionButton.label}
      </Button>
    </div>
  );
}

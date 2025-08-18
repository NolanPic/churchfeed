"use client";

import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";
import { ReactNode } from "react";
import classNames from "classnames";

interface EditorToolbarProps {
  actionButton: {
    label: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  };
  leftSlot?: ReactNode;
  className?: string;
}

export default function EditorToolbar({
  actionButton,
  leftSlot,
  className,
}: EditorToolbarProps) {
  return (
    <div className={classNames(styles.postEditorToolbar, className)}>
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

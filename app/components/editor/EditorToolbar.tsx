"use client";

import styles from "./PostEditorToolbar.module.css";
import Button from "../common/Button";
import { ReactNode } from "react";
import classNames from "classnames";
import { useEditorCommands } from "@/app/context/EditorCommands";

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
  const { addImageDrop } = useEditorCommands();

  return (
    <div className={classNames(styles.postEditorToolbar, className)}>
      {leftSlot}
      <div className={styles.actions}>
        <Button
          icon="image"
          color="none"
          onClick={addImageDrop}
          iconSize={20}
        />
        <Button
          icon={actionButton.icon}
          onClick={actionButton.onClick}
          disabled={actionButton.disabled}
          className={actionButton.className ?? styles.postButton}
        >
          {actionButton.label}
        </Button>
      </div>
    </div>
  );
}

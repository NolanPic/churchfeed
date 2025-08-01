"use client";

import Backdrop from "../common/Backdrop";
import styles from "./PostEditor.module.css";

interface PostEditorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function PostEditor({ isOpen, setIsOpen }: PostEditorProps) {
  return (
    <>
      <div className={styles.postEditor} style={isOpen ? { zIndex: 2 } : {}}>
        <em>What's happening?</em>
      </div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}

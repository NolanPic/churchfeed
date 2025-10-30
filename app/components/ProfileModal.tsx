import React, { useEffect, useState } from "react";
import styles from "./ProfileModal.module.css";
import Modal from "./common/Modal";
import Button from "./common/Button";
import UserAvatar from "./UserAvatar";
import { Input } from "./common/Input";
import IconButton from "./common/IconButton";
import { useUserAuth } from "@/auth/client/useUserAuth";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const disableSave = name.trim() === "" || email.trim() === "";
  const [, { user }] = useUserAuth();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  return (
    <Modal
      title="Profile"
      isOpen={true}
      onClose={onClose}
      toolbar={({ onClose }) => (
        <div className={styles.toolbarActions}>
          <IconButton icon="close" onClick={onClose} />
          <IconButton
            type="submit"
            icon="image"
            variant="primary"
            disabled={disableSave}
          />
        </div>
      )}
    >
      <div className={styles.profile}>
        <div className={styles.contentContainer}>
          <div className={styles.avatarContainer}>
            {user && <UserAvatar user={user} size={100} />}
            <p>Change Photo</p>
          </div>
          <div className={styles.content}>
            <form className={styles.form}>
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </form>
            <div className={styles.actionsDesktop}>
              <Button
                type="submit"
                icon="send"
                variant="primary"
                disabled={disableSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

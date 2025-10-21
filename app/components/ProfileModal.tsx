import React, {useEffect, useState} from "react";
import styles from "./ProfileModal.module.css";
import { useAuthedUser } from "../hooks/useAuthedUser";
import Modal from "./common/Modal";
import Button from "./common/Button";
import UserAvatar from "./UserAvatar";
import {Input} from "./common/Input";
import IconButton from "./common/IconButton";

export default function ProfileModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const disableSave = name.trim() === "" || email.trim() === "";
    const { user, isSignedIn, signOut } = useAuthedUser();

    useEffect(()=> {
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
        <IconButton icon="close" onClick={onClose}/>
   )}
        >
        <div className={styles.profile}>
            <div className={styles.contentContainer}>
                <div className={styles.avatarContainer}>
                    <UserAvatar user={user} size={100}></UserAvatar>
                    <p>Change Photo</p>
                </div>
                <div className={styles.content}>
                    <form className={styles.form}>
                        <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
                        <Input type="email" label="Email" value={email} onChange={e => setEmail(e.target.value)} />
                    
                    </form> 
                <div className={styles.actionsDesktop}>
                    <Button type="submit" icon="send" className={styles.profileButton} disabled={disableSave}>Save</Button>
                </div>
                </div>
                <div className={styles.actionsMobile}>
                    <Button type="submit" icon="send" disabled={disableSave}></Button>
                </div>
            </div>
        </div>
        </Modal>
  ); 
} 
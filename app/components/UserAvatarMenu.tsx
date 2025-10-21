import UserAvatar from "./UserAvatar";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import styles from "./UserAvatarMenu.module.css";
import { useState } from "react";
import Backdrop from "./common/Backdrop";
import { motion, AnimatePresence } from "framer-motion";

interface UserAvatarMenuProps {
  openProfileModal: () => void;
}
const UserAvatarMenu = ({ openProfileModal }: UserAvatarMenuProps) => {
  const { user, signOut } = useAuthedUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className={styles.userAvatarMenu}>
      <button onClick={() => setIsOpen(!isOpen)}>
        <UserAvatar user={user} size={54} highlight={true} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.ul
              className={styles.userAvatarMenuList}
              style={isOpen ? { zIndex: 2 } : {}}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <li className={styles.userAvatarMenuItem}>
                <button
                  type="button"
                  onClick={() => {
                    openProfileModal();
                    setIsOpen(false);
                  }}
                >
                  Profile
                </button>
              </li>
              <li className={styles.userAvatarMenuItem}>
                <button
                  onClick={() => {
                    signOut({
                      redirectUrl: "/",
                    });
                  }}
                >
                  Sign out
                </button>
              </li>
            </motion.ul>
            <Backdrop onClick={() => setIsOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatarMenu;

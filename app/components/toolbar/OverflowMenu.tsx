import Icon from "../common/Icon";
import Link from "next/link";
import styles from "./OverflowMenu.module.css";
import UserAvatar from "../UserAvatar";
import { useUserAuth } from "@/lib/auth/client/useUserAuth";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";
import { useContext } from "react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const OverflowMenuItem = ({ label, icon, href }: MenuItem) => {
  return (
    <li role="none" className={styles.overflowMenuItem}>
      <Link role="menuitem" href={href}>
        {icon}
        <p>{label}</p>
      </Link>
    </li>
  );
};

interface OverflowMenuProps {
  showAdminSettings: boolean;
  showFeedSettings: boolean;
}

const ICON_SIZE = 24;

export default function OverflowMenu({
  showAdminSettings,
  showFeedSettings,
}: OverflowMenuProps) {
  const [, { user }] = useUserAuth();
  const { feedId } = useContext(CurrentFeedAndPostContext);
  return (
    <ul
      popover="auto"
      role="menu"
      id="overflow-menu"
      className={styles.overflowMenu}
    >
      {showFeedSettings && !!feedId && (
        <OverflowMenuItem
          label="Feed settings"
          icon={<Icon name="toggles" size={ICON_SIZE} />}
          href={`/feed/${feedId}/settings`}
        />
      )}
      {showAdminSettings && (
        <OverflowMenuItem
          label="Admin"
          icon={<Icon name="gear" size={ICON_SIZE} />}
          href="/admin"
        />
      )}
      {user && (
        <OverflowMenuItem
          label="Profile"
          icon={<UserAvatar user={user} size={ICON_SIZE} />}
          href="/profile"
        />
      )}
      <OverflowMenuItem
        label="Sign out"
        icon={<Icon name="logout" size={ICON_SIZE} />}
        href="/logout"
      />
    </ul>
  );
}

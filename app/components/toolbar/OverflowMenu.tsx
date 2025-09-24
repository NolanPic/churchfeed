import Icon from "../common/Icon";
import Link from "next/link";
import styles from "./OverflowMenu.module.css";
import UserAvatar from "../UserAvatar";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const OverflowMenuItem = ({ label, icon, href }: MenuItem) => {
  return (
    <li className={styles.overflowMenuItem}>
      <Link href={href}>
        {icon}
        <p>{label}</p>
      </Link>
    </li>
  );
};

export default function OverflowMenu() {
  const { user } = useAuthedUser();
  const ICON_SIZE = 24;

  return (
    <ul popover="auto" id="overflow-menu" className={styles.overflowMenu}>
      <OverflowMenuItem
        label="Feed settings"
        icon={<Icon name="toggles" size={ICON_SIZE} />}
        href="/feed-settings"
      />
      <OverflowMenuItem
        label="Admin"
        icon={<Icon name="gear" size={ICON_SIZE} />}
        href="/admin"
      />
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
        href="/sign-out"
      />
    </ul>
  );
}

import Icon from "../common/Icon";
import Link from "next/link";
import styles from "./OverflowMenu.module.css";
import UserAvatar from "../UserAvatar";
import { useAuthedUser } from "@/app/hooks/useAuthedUser";
import { useContext } from "react";
import { CurrentFeedAndPostContext } from "@/app/context/CurrentFeedAndPostProvider";

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
  const { user, feeds: userFeeds } = useAuthedUser();
  const ICON_SIZE = 24;

  const { feedId } = useContext(CurrentFeedAndPostContext);

  const isAdmin = user?.type === "admin";
  const isFeedOwner =
    feedId && userFeeds.find((f) => f._id === feedId && f.owner);

  return (
    <ul popover="auto" id="overflow-menu" className={styles.overflowMenu}>
      {isFeedOwner && (
        <OverflowMenuItem
          label="Feed settings"
          icon={<Icon name="toggles" size={ICON_SIZE} />}
          href={`/feed/${feedId}/settings`}
        />
      )}
      {isAdmin && (
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
        href="/sign-out"
      />
    </ul>
  );
}

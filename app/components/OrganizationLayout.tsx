"use client";

import UserAvatarMenu from "./UserAvatarMenu";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useOrganization } from "../context/OrganizationProvider";
import { usePathname } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import styles from "./OrganizationLayout.module.css";
import Image from "next/image";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import NotificationsSidebar from "./NotificationsSidebar";
import Icon from "./common/Icon";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = useOrganization();
  const pathname = usePathname();
  const [auth] = useUserAuth();
  const isSignedIn = auth !== null;
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] = useState(false);

  const orgId = org?._id as Id<"organizations">;
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn && orgId ? { orgId } : "skip"
  );

  if (org === null) {
    return (
      <div className={styles.notFound}>
        <p>Hmm, that doesn&apos;t exist. 🤔🤷‍♀️</p>
      </div>
    );
  }

  return (
    <>
      {pathname !== "/login" && (
        <>
          {isSignedIn ? (
            <>
              <button
                type="button"
                className={styles.notificationBellButton}
                onClick={() => setIsNotificationsSidebarOpen(true)}
                aria-label="Open notifications"
              >
                <Icon name="bell" size={24} />
                {unreadCount !== undefined && unreadCount > 0 && (
                  <span className={styles.badge}>{unreadCount}</span>
                )}
              </button>
              <div className={styles.userAvatarMenu}>
                <UserAvatarMenu />
              </div>
            </>
          ) : (
            <div className={styles.loginLink}>
              <Link href="/login">Sign in</Link>
            </div>
          )}
        </>
      )}
      <section className={styles.header}>
        <h1 className={styles.mainTitle}>{org?.name}</h1>
        <h2 className={styles.location}>{org?.location}</h2>
        <Image
          src="/icons/chevron-down.svg"
          role="presentation"
          alt=""
          width={22}
          height={22}
          className={styles.lightPointer}
        />
      </section>
      {org?._id && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={styles.feedWrapper}
        >
          {children}
        </motion.section>
      )}
      <AnimatePresence>
        {isNotificationsSidebarOpen && (
          <NotificationsSidebar
            isOpen={isNotificationsSidebarOpen}
            onClose={() => setIsNotificationsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

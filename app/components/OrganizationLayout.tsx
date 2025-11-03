"use client";

import UserAvatarMenu from "./UserAvatarMenu";
import Link from "next/link";
import { motion } from "motion/react";
import { useOrganization } from "../context/OrganizationProvider";
import { usePathname } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import styles from "./OrganizationLayout.module.css";
import { useState } from "react";
import ProfileModal from "./ProfileModal";
import Image from "next/image";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = useOrganization();
  const pathname = usePathname();
  const [auth] = useUserAuth();
  const isSignedIn = auth !== null;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
            <div className={styles.userAvatarMenu}>
              <UserAvatarMenu
                openProfileModal={() => setIsProfileModalOpen(true)}
              />
            </div>
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
      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </>
  );
}

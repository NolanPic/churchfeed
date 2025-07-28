"use client";

import { motion } from "motion/react";
import { useOrganization } from "../context/OrganizationProvider";
import styles from "./OrganizationLayout.module.css";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = useOrganization();

  if (org === null) {
    return (
      <div className={styles.notFound}>
        <p>Hmm, that doesn&apos;t exist. 🤔🤷‍♀️</p>
      </div>
    );
  }

  return (
    <div className={styles.feedWrapper}>
      <h1 className={styles.mainTitle}>{org?.name}</h1>
      <h2 className={styles.location}>{org?.location}</h2>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "var(--pointer-height)" }}
        transition={{ duration: 0.25 }}
        className={styles.lightPointer}
      ></motion.div>
      {org?._id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

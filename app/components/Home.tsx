"use client";

import styles from "./Home.module.css";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Feed from "./Feed";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

export default function Home({
  preloadedOrg,
  feedId,
}: {
  preloadedOrg: Preloaded<typeof api.organizations.getOrganizationBySubdomain>;
  feedId: Id<"feeds"> | null;
}) {
  const org = usePreloadedQuery(preloadedOrg);

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
          <Feed orgId={org?._id} feedIdSlug={feedId} />
        </motion.div>
      )}
    </div>
  );
}

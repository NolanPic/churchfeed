"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import styles from "./page.module.css";
import Feed from "./components/Feed";

export default function Home() {
  const org = useQuery(api.organizations.getOrganization);
  return (
    <div className={styles.feedWrapper}>
      <h1 className={styles.mainTitle}>{org?.name}</h1>
      <h2 className={styles.location}>{org?.location}</h2>
      <div className={styles.lightPointer}></div>
      <Feed />
    </div>
  );
}

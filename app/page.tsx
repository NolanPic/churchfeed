"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import styles from "./page.module.css";
import Feed from "./components/Feed";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function Home() {
  const org = useQuery(api.organizations.getOrganization);
  const [feedId] = useState<Id<"feeds"> | null>("k9731m7p1z48t2dtjv640fpesd7hbrg2" as Id<"feeds">);
  return (
    <div className={styles.feedWrapper}>
      <h1 className={styles.mainTitle}>{org?.name}</h1>
      <h2 className={styles.location}>{org?.location}</h2>
      <div className={styles.lightPointer}></div>
      {org?._id && feedId && (<Feed orgId={org?._id} feedId={feedId} />)} 
    </div>
  );
}

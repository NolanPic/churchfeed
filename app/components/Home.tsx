"use client";

import styles from "./Home.module.css";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Feed from "./Feed";

export default function Home(props: {
  preloadedOrg: Preloaded<typeof api.organizations.getOrganization>;
}) {
  const org = usePreloadedQuery(props.preloadedOrg);

  return (
    <div className={styles.feedWrapper}>
      <h1 className={styles.mainTitle}>{org?.name}</h1>
      <h2 className={styles.location}>{org?.location}</h2>
      <div className={styles.lightPointer}></div>
      {org?._id && <Feed orgId={org?._id} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardBody } from "../common/Card";
import Button from "../common/Button";
import StackedUsers from "../common/StackedUsers";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./OpenFeedCard.module.css";

type AvatarUser = {
  _id: Id<"users">;
  name: string;
  image: string | null;
};

interface OpenFeedCardProps {
  feed: Doc<"feeds">;
  isUserMember: boolean;
  users: AvatarUser[];
}

const OpenFeedCard = ({ feed, isUserMember, users }: OpenFeedCardProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const router = useRouter();
  const joinOpenFeed = useMutation(api.userMemberships.joinOpenFeed);

  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(isUserMember);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);

    try {
      await joinOpenFeed({
        orgId,
        feedId: feed._id,
      });
      setHasJoined(true);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join feed"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleView = () => {
    router.push(`/feed/${feed._id}`);
  };

  const getJoinButtonText = () => {
    if (isJoining) return "Joining...";
    if (hasJoined) return "Joined";
    return "Join";
  };

  return (
    <Card className={styles.openFeedCard}>
      <CardHeader>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{feed.name}</h3>
            {feed.privacy === "public" && (
              <Image
                src="/icons/globe.svg"
                alt="Public feed"
                width={20}
                height={20}
                className={styles.globeIcon}
              />
            )}
          </div>
          <StackedUsers
            users={users}
            numberOfAvatarsToShow={3}
            showRemainingCount={true}
          />
        </div>
      </CardHeader>
      <CardBody>
        {feed.description && (
          <div className={styles.descriptionContainer}>
            <input
              type="checkbox"
              id={`expand-${feed._id}`}
              className={styles.expandCheckbox}
              checked={isExpanded}
              onChange={(e) => setIsExpanded(e.target.checked)}
            />
            <p className={styles.description}>
              {feed.description}
            </p>
            <label
              htmlFor={`expand-${feed._id}`}
              className={styles.readMoreButton}
            >
              Read more
            </label>
          </div>
        )}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleJoin}
            disabled={isJoining || hasJoined}
          >
            {getJoinButtonText()}
          </Button>
          <Button onClick={handleView}>View</Button>
        </div>
        {joinError && <p className={styles.error}>{joinError}</p>}
      </CardBody>
    </Card>
  );
};

export default OpenFeedCard;

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "../context/OrganizationProvider";
import { useUserAuth } from "@/auth/client/useUserAuth";
import UserSelect, { UserOption } from "./common/UserSelect";
import Button from "./common/Button";
import { CardList } from "./common/CardList";
import Select from "./common/Select";
import UserAvatar from "./UserAvatar";
import Hint from "./common/Hint";
import styles from "./FeedMembersTab.module.css";

interface FeedMembersTabProps {
  feedId: Id<"feeds">;
}

export default function FeedMembersTab({ feedId }: FeedMembersTabProps) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const [auth] = useUserAuth();
  const currentUser = auth?.getUser();
  const [isFeedOwner, setIsFeedOwner] = useState(false);

  const feed = useQuery(api.feeds.getFeed, { orgId, feedId });
  const {
    results: members,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.userMemberships.getFeedMembers,
    { orgId, feedId },
    { initialNumItems: 20 }
  );
  // Only fetch users not in feed if user is an owner
  const usersNotInFeed = useQuery(
    api.userMemberships.getUsersNotInFeed,
    isFeedOwner ? { orgId, feedId } : "skip"
  );

  const inviteUsersToFeed = useMutation(api.userMemberships.inviteUsersToFeed);
  const removeMemberFromFeed = useMutation(
    api.userMemberships.removeMemberFromFeed
  );
  const changeMemberRole = useMutation(api.userMemberships.changeMemberRole);

  // Invite section state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [showInvited, setShowInvited] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Error state for general errors (role change, remove)
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Track role changes in progress
  const [roleChangesInProgress, setRoleChangesInProgress] = useState<
    Set<Id<"users">>
  >(new Set());

  const currentUserIsOnlyOwner = Boolean(
    members &&
      currentUser &&
      members.filter((m) => m.isOwner).length === 1 &&
      members.find((m) => m._id === currentUser._id)?.isOwner
  );

  const handleInvite = async () => {
    if (selectedUserIds.length === 0) return;

    setIsInviting(true);
    setInviteError(null);
    setGeneralError(null);

    try {
      await inviteUsersToFeed({
        orgId,
        feedId,
        userIds: selectedUserIds as Id<"users">[],
      });

      // Success: clear selection and show "Invited!"
      setSelectedUserIds([]);
      setShowInvited(true);
      setTimeout(() => setShowInvited(false), 2000);
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "Failed to invite users"
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: Id<"users">, newRole: string) => {
    setRoleChangesInProgress((prev) => new Set(prev).add(userId));
    setGeneralError(null);

    const isOwner = newRole === "Owner";

    try {
      await changeMemberRole({ orgId, feedId, userId, isOwner });
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Failed to change member role"
      );
      // Role will revert automatically since we're not tracking local state
    } finally {
      setRoleChangesInProgress((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleRemoveMember = async (userId: Id<"users">, userName: string) => {
    setGeneralError(null);

    const isCurrentUser = userId === currentUser?._id;
    const confirmMessage = isCurrentUser
      ? `Are you sure you want to leave ${feed?.name || "this feed"}?`
      : `Are you sure you want to remove ${userName} from ${feed?.name || "this feed"}?`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    try {
      await removeMemberFromFeed({ orgId, feedId, userId });
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
  };

  // Check if current user is a feed owner
  useEffect(() => {
    if (!auth || !feedId) {
      setIsFeedOwner(false);
      return;
    }

    auth
      .feed(feedId)
      .hasRole("owner")
      .then((result) => {
        setIsFeedOwner(result.allowed);
      });
  }, [auth, feedId]);

  // Clear invite error when selection changes
  useEffect(() => {
    if (inviteError && selectedUserIds.length > 0) {
      setInviteError(null);
    }
  }, [selectedUserIds, inviteError]);

  // Convert usersNotInFeed to UserOption format
  const userOptions: UserOption[] =
    usersNotInFeed?.map((user) => ({
      _id: user._id,
      name: user.name,
      image: user.image,
      text: user.name,
      value: user._id,
    })) || [];

  const inviteButtonText = showInvited
    ? "Invited!"
    : isInviting
      ? "Inviting..."
      : "Invite";

  const isInviteButtonDisabled =
    selectedUserIds.length === 0 || isInviting || showInvited;

  return (
    <div className={styles.container}>
      {generalError && (
        <Hint type="error" className={styles.errorBanner}>
          {generalError}
        </Hint>
      )}

      {isFeedOwner && (
        <div className={styles.inviteSection}>
          <UserSelect
            users={userOptions}
            placeholder={`Select users to invite...`}
            values={selectedUserIds}
            onChange={(value, isDeselecting) => {
              if (isDeselecting) {
                setSelectedUserIds((prev) => prev.filter((id) => id !== value));
              } else {
                setSelectedUserIds((prev) => [...prev, value]);
              }
            }}
            error={inviteError || undefined}
            disabled={isInviting}
          />
          <Button
            onClick={handleInvite}
            disabled={isInviteButtonDisabled}
            variant="primary"
            className={styles.inviteButton}
          >
            {inviteButtonText}
          </Button>
        </div>
      )}

      <CardList
        data={members || []}
        status={status === "LoadingMore" ? "CanLoadMore" : status}
        loadMore={loadMore}
        itemsPerPage={8}
        renderCardHeader={(member) => (
          <div className={styles.memberHeader}>
            <UserAvatar user={member} size={56} />
            <div className={styles.memberInfo}>
              <div className={styles.memberName}>{member.name}</div>
              <div className={styles.memberEmail}>{member.email}</div>
            </div>
          </div>
        )}
        renderCardBody={(member) => {
          const isThisMemberTheOnlyOwner =
            currentUserIsOnlyOwner && member._id === currentUser?._id;
          const isRoleChanging = roleChangesInProgress.has(member._id);
          const isThisMemberTheCurrentUser = member._id === currentUser?._id;
          const showButton = isFeedOwner || isThisMemberTheCurrentUser;

          return (
            <div className={styles.memberActions}>
              {isFeedOwner ? (
                <Select
                  options={[
                    { value: "Member", label: "Member" },
                    { value: "Owner", label: "Owner" },
                  ]}
                  value={member.isOwner ? "Owner" : "Member"}
                  onChange={(value) => handleRoleChange(member._id, value)}
                  disabled={isThisMemberTheOnlyOwner || isRoleChanging}
                  className={styles.roleSelect}
                />
              ) : (
                <div className={styles.roleLabel}>
                  {member.isOwner ? "Feed owner" : "Feed member"}
                </div>
              )}
              {showButton && (
                <Button
                  onClick={() => handleRemoveMember(member._id, member.name)}
                  disabled={isThisMemberTheOnlyOwner}
                >
                  {isThisMemberTheCurrentUser ? "Leave" : "Remove"}
                </Button>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

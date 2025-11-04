"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input, InputHandle } from "./common/Input";
import { Select, SelectHandle, SelectOption } from "./common/Select";
import Button from "./common/Button";
import Hint from "./common/Hint";
import { useOrganization } from "../context/OrganizationProvider";
import styles from "./FeedSettingsModalContent.module.css";

interface FeedSettingsModalContentProps {
  feedId: Id<"feeds">;
}

export interface FeedSettingsModalContentHandle {
  hasUnsavedChanges: () => boolean;
}

interface FormData {
  name: string;
  description: string;
  privacy: "public" | "private" | "open";
  canPost: "yes" | "no";
  canMessage: "yes" | "no";
}

const FeedSettingsModalContent = forwardRef<
  FeedSettingsModalContentHandle,
  FeedSettingsModalContentProps
>(({ feedId }, ref) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  // Fetch feed data
  const feed = useQuery(api.feeds.getFeed, { orgId, feedId });
  const updateFeed = useMutation(api.feeds.updateFeed);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    privacy: "private",
    canPost: "no",
    canMessage: "no",
  });

  // Track initial data to detect changes
  const [initialData, setInitialData] = useState<FormData | null>(null);

  // Save button states
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refs for validation
  const nameRef = useRef<InputHandle>(null);
  const descriptionRef = useRef<InputHandle>(null);
  const privacyRef = useRef<SelectHandle>(null);

  // Load feed data into form
  useEffect(() => {
    if (!feed) return;

    const canPost =
      feed.memberPermissions?.includes("post") ? "yes" : ("no" as const);
    const canMessage =
      feed.memberPermissions?.includes("message") ? "yes" : ("no" as const);

    const data: FormData = {
      name: feed.name,
      description: feed.description || "",
      privacy: feed.privacy,
      canPost,
      canMessage,
    };

    setFormData(data);
    setInitialData(data);
  }, [feed]);

  // Handle privacy change - reset permissions to "no" when changing to "public"
  const handlePrivacyChange = (value: string) => {
    const newPrivacy = value as "public" | "private" | "open";
    setFormData((prev) => ({
      ...prev,
      privacy: newPrivacy,
      canPost: newPrivacy === "public" ? "no" : prev.canPost,
      canMessage: newPrivacy === "public" ? "no" : prev.canMessage,
    }));
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    if (!initialData) return false;
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  };

  // Expose hasUnsavedChanges to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      hasUnsavedChanges,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData, initialData]
  );

  // Validate all fields
  const validateForm = (): boolean => {
    const nameValid = nameRef.current?.validate() ?? true;
    const descriptionValid = descriptionRef.current?.validate() ?? true;
    const privacyValid = privacyRef.current?.validate() ?? true;

    return nameValid && descriptionValid && privacyValid;
  };

  // Handle form submission
  const handleSave = async () => {
    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      // Build memberPermissions array
      const memberPermissions: ("post" | "message")[] = [];
      if (formData.canPost === "yes") memberPermissions.push("post");
      if (formData.canMessage === "yes") memberPermissions.push("message");

      await updateFeed({
        orgId,
        feedId,
        name: formData.name,
        description: formData.description || undefined,
        privacy: formData.privacy,
        memberPermissions: memberPermissions.length > 0 ? memberPermissions : undefined,
      });

      // Update initial data to reflect saved state
      setInitialData(formData);

      // Show "Saved!" for 2 seconds
      setShowSaved(true);
      setTimeout(() => {
        setShowSaved(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feed settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Privacy options
  const privacyOptions: SelectOption[] = [
    { value: "public", label: "Public" },
    { value: "open", label: "Open" },
    { value: "private", label: "Private" },
  ];

  // Permission options
  const yesNoOptions: SelectOption[] = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  // Loading state
  if (feed === undefined) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Error loading feed
  if (feed === null) {
    return (
      <div className={styles.error}>
        <p>Feed not found or you do not have access to this feed.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <Hint type="error" className={styles.errorBanner}>
          {error}
        </Hint>
      )}

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <Input
          ref={nameRef}
          label="Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          validationConfig={{
            required: true,
            minLength: 4,
            maxLength: 25,
          }}
          fieldName="Name"
        />

        <Input
          ref={descriptionRef}
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          validationConfig={{
            maxLength: 600,
          }}
          fieldName="Description"
        />

        <Select
          ref={privacyRef}
          label="Privacy"
          options={privacyOptions}
          value={formData.privacy}
          onChange={handlePrivacyChange}
          validationConfig={{ required: true }}
          fieldName="Privacy"
        />

        <Select
          label="Members can post?"
          options={yesNoOptions}
          value={formData.canPost}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              canPost: value as "yes" | "no",
            }))
          }
        />

        <Select
          label="Members can message?"
          options={yesNoOptions}
          value={formData.canMessage}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              canMessage: value as "yes" | "no",
            }))
          }
        />

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving || showSaved}
          >
            {showSaved ? "Saved!" : isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
});

FeedSettingsModalContent.displayName = "FeedSettingsModalContent";

export default FeedSettingsModalContent;

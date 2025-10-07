import { useState, RefObject } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOrganization } from "../context/OrganizationProvider";
import { Id } from "../../convex/_generated/dataModel";
import { EditorHandle } from "../components/editor/Editor";
import { isEditorEmpty } from "../components/editor/editor-utils";

type PostState = "drafting" | "posting" | "posted" | "error";

export function useOnPost(
  feedId: Id<"feeds"> | null,
  editorRef: RefObject<EditorHandle | null>
) {
  const [state, setState] = useState<PostState>("drafting");
  const [error, setError] = useState<string | null>(null);
  const createPost = useMutation(api.posts.createPost);
  const org = useOrganization();

  const onPost = async () => {
    setState("posting");
    setError(null);

    const postContent = editorRef.current?.getJSON() ?? null;

    if (!postContent || isEditorEmpty(postContent)) {
      setError("Please add some content to your post");
      setState("error");
      return;
    }

    if (!org || !feedId) {
      setError("No organization or feed found");
      setState("error");
      return;
    }

    try {
      await createPost({
        orgId: org._id,
        feedId: feedId,
        content: JSON.stringify(postContent),
      });
      setState("posted");
    } catch (error) {
      console.error(error);
      setError("Failed to create post. Please contact support");
      setState("error");
    }
  };

  const reset = () => {
    setState("drafting");
    setError(null);
  }

  return { state, error, onPost, reset };
}


import { useState, RefObject } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useOrganization } from "../context/OrganizationProvider";
import { Id } from "../../convex/_generated/dataModel";
import { EditorHandle } from "../components/editor/Editor";
import { isEditorEmpty } from "../components/editor/editor-utils";

type PublishState = "drafting" | "publishing" | "published" | "error";

export function useOnPublish(
  source: "post" | "message",
  editorRef: RefObject<EditorHandle | null>,
  parentId: Id<"feeds"> | Id<"posts"> | null
) {
  const [state, setState] = useState<PublishState>("drafting");
  const [error, setError] = useState<string | null>(null);
  const [publishedSourceId, setPublishedSourceId] = useState<
    Id<"posts"> | Id<"messages">
  >();
  const createPost = useMutation(api.posts.createPost);
  const createMessage = useMutation(api.messages.create);
  const org = useOrganization();

  const onPublish = async () => {
    setState("publishing");
    setError(null);

    const content = editorRef.current?.getJSON() ?? null;

    if (!content || isEditorEmpty(content)) {
      setError("Please add some content");
      setState("error");
      return;
    }

    if (!org || !parentId) {
      setError("No organization or parent found");
      setState("error");
      return;
    }

    let sourceId;
    try {
      if (source === "post") {
        sourceId = await createPost({
          orgId: org._id,
          feedId: parentId as Id<"feeds">,
          content: JSON.stringify(content),
        });
      } else {
        sourceId = await createMessage({
          orgId: org._id,
          postId: parentId as Id<"posts">,
          content: JSON.stringify(content),
        });
      }
      setPublishedSourceId(sourceId);
      setState("published");
    } catch (error) {
      console.error(error);
      setError("Failed to publish content. Please contact support");
      setState("error");
    }
  };

  const reset = () => {
    setState("drafting");
    setError(null);
    setPublishedSourceId(undefined);
  };

  return { state, error, onPublish, publishedSourceId, reset };
}

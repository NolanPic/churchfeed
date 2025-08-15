import { JSONContent } from "@tiptap/core";

export function isEditorEmpty(block: JSONContent): boolean {
    if (!block || !block.type) {
      return true;
    }
    if ("text" in block) {
      return !block.text?.trim();
    }
    return block.content
      ? block.content.every((childBlock) => isEditorEmpty(childBlock))
      : true;
  }
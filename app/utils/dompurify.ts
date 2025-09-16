import DOMPurify from "dompurify";

let initialized = false;

export function getDOMPurify() {
    if (!initialized) {
      DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if ("href" in node) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      });
      initialized = true;
    }
    return DOMPurify;
  }
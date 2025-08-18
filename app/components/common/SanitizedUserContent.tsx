"use client";

import { useMemo } from "react";
import DOMPurify, { type Config } from "dompurify";

export interface SanitizedUserContentProps {
  html: string;
  className?: string;
  sanitizeOptions?: Config;
}

const SanitizedUserContent: React.FC<SanitizedUserContentProps> = ({
  html,
  className,
  sanitizeOptions,
}) => {
  const sanitizedHtml = useMemo(() => {
    let options = sanitizeOptions;
    if (!options) {
      options = {
        FORBID_TAGS: ["script", "style"],
      };
    }

    if (!html) return "";
    return DOMPurify.sanitize(html, options);
  }, [html, sanitizeOptions]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default SanitizedUserContent;

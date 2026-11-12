"use client";

import { useCallback, useEffect, useState } from "react";
import { sessionGet, sessionRemove, sessionSet } from "@/utils/safeStorage";

const keyOf = (postId: string) => `mdsig-comment-draft:${postId}`;

/**
 * The comment being typed, kept in sessionStorage per post. Logging in
 * leaves the page for Google and comes back, so without this a visitor who
 * typed first would lose the text.
 */
export function useCommentDraft(postId: string | undefined) {
  const [text, setTextState] = useState("");

  useEffect(() => {
    if (!postId) {
      return;
    }
    const saved = sessionGet(keyOf(postId));
    if (saved) {
      setTextState(saved);
    }
  }, [postId]);

  const setText = useCallback(
    (value: string) => {
      setTextState(value);
      if (!postId) {
        return;
      }
      if (value) {
        sessionSet(keyOf(postId), value);
      } else {
        sessionRemove(keyOf(postId));
      }
    },
    [postId],
  );

  return [text, setText] as const;
}

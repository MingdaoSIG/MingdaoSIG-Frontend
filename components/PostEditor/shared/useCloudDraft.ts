"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TDraftFields } from "@/interfaces/Reading";
import { CustomStatus } from "@/modules/customStatusCode";
import { DRAFT_CONTENT_MAX, saveDraft } from "@/modules/drafts";
import type { TPostAPI } from "../types/postAPI";

// Autosave to a cloud draft (contract v4 §4.5) while signed in: 3 s after
// the last change, when the window loses focus or the tab is hidden, and
// on leaving the page. A failed save keeps the changes, says so, and
// retries with a growing delay; a full draft box (4026) waits for the
// user to free a slot.

export const AUTOSAVE_DELAY_MS = 3000;
const RETRY_DELAYS_MS = [10000, 20000, 40000, 60000];
/** Browsers cap keepalive request bodies at 64 KB. */
const KEEPALIVE_MAX_BYTES = 60000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type DraftStatus =
  | { kind: "off" }
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string }
  | { kind: "full" };

export function draftFields(data: TPostAPI, post: string | null): TDraftFields {
  return {
    title: data.title ?? "",
    sig: data.sig ?? "",
    content: data.content ?? "",
    cover: data.cover ?? "",
    hashtag: Array.isArray(data.hashtag) ? data.hashtag : [],
    post,
  };
}

function snapshotOf(data: TPostAPI, post: string | null) {
  return JSON.stringify(draftFields(data, post));
}

export function useCloudDraft({
  enabled,
  data,
  post,
  token,
  skip,
}: {
  /** Signed in and the editor has loaded what it starts from. */
  enabled: boolean;
  data: TPostAPI;
  /** The post being edited; null for a new post. */
  post: string | null;
  token: string | null;
  /** Content not worth a draft (empty, or unchanged from the post). */
  skip: (data: TPostAPI) => boolean;
}) {
  const [draftId, setDraftIdState] = useState<string | null>(null);
  const [status, setStatus] = useState<DraftStatus>({ kind: "idle" });
  const draftIdRef = useRef<string | null>(null);
  const savedRef = useRef<string | null>(null);
  const dataRef = useRef(data);
  const skipRef = useRef(skip);
  const enabledRef = useRef(enabled);
  const tokenRef = useRef(token);
  const inflight = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  const full = useRef(false);
  const paused = useRef(false);
  dataRef.current = data;
  skipRef.current = skip;
  enabledRef.current = enabled;
  tokenRef.current = token;

  const snapshot = snapshotOf(data, post);

  const setDraftId = useCallback((id: string | null) => {
    draftIdRef.current = id;
    setDraftIdState(id);
  }, []);

  const isDirty = useCallback(() => {
    if (!enabledRef.current || skipRef.current(dataRef.current)) {
      return false;
    }
    return snapshotOf(dataRef.current, post) !== savedRef.current;
  }, [post]);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const save = useCallback(async (): Promise<void> => {
    clearTimer();
    if (inflight.current) {
      await inflight.current;
    }
    if (!isDirty() || full.current || paused.current) {
      return;
    }
    const sent = snapshotOf(dataRef.current, post);
    const fields = draftFields(dataRef.current, post);
    if (fields.content.length > DRAFT_CONTENT_MAX) {
      setStatus({
        kind: "error",
        message: `內文超過 ${DRAFT_CONTENT_MAX.toLocaleString("zh-TW")} 字，雲端草稿存不下`,
      });
      return;
    }
    const task = (async () => {
      setStatus({ kind: "saving" });
      let result = await saveDraft(draftIdRef.current, fields);
      // Deleted elsewhere (another tab, the drafts list): start a new one.
      if (
        !result.ok &&
        draftIdRef.current &&
        (result.kind === "not-found" ||
          result.status === CustomStatus.NOT_FOUND)
      ) {
        setDraftId(null);
        result = await saveDraft(null, fields);
      }
      if (result.ok) {
        attempt.current = 0;
        savedRef.current = sent;
        if (result.data.id && result.data.id !== draftIdRef.current) {
          setDraftId(result.data.id);
        }
        setStatus({ kind: "saved", at: new Date() });
        return;
      }
      if (result.status === CustomStatus.INVALID_CONTENT_LENGTH) {
        // Over 100000 characters: retrying cannot help.
        setStatus({
          kind: "error",
          message: `內文超過 ${DRAFT_CONTENT_MAX.toLocaleString("zh-TW")} 字，雲端草稿存不下`,
        });
        return;
      }
      if (result.status === CustomStatus.CONTENT_SIZE_EXCEEDED) {
        // 4026 here is the 20-draft limit (the content cap is checked
        // before a save is sent).
        full.current = true;
        setStatus({ kind: "full" });
        return;
      }
      setStatus({ kind: "error", message: result.message });
      const delay =
        RETRY_DELAYS_MS[Math.min(attempt.current, RETRY_DELAYS_MS.length - 1)];
      attempt.current += 1;
      timer.current = setTimeout(() => {
        void save();
      }, delay);
    })();
    inflight.current = task;
    try {
      await task;
    } finally {
      inflight.current = null;
    }
  }, [clearTimer, isDirty, post, setDraftId]);

  // Debounce: every change restarts the 3 s wait.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (!isDirty()) {
      return;
    }
    if (full.current || paused.current) {
      return;
    }
    clearTimer();
    setStatus((current) =>
      current.kind === "error" ? current : { kind: "pending" },
    );
    timer.current = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
  }, [snapshot, enabled, clearTimer, isDirty, save]);

  useEffect(() => clearTimer, [clearTimer]);

  // Blur, hidden tab, leaving: save now. On unload the page is going away,
  // so a keepalive request carries the last changes when they fit.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const flushNow = () => {
      if (isDirty()) {
        void save();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushNow();
      }
    };
    const onPageHide = () => {
      if (!isDirty() || full.current || paused.current || !tokenRef.current) {
        return;
      }
      const body = JSON.stringify(draftFields(dataRef.current, post));
      if (new Blob([body]).size > KEEPALIVE_MAX_BYTES) {
        return;
      }
      const id = draftIdRef.current;
      try {
        void fetch(`${API_URL}${id ? `/draft/${id}` : "/draft"}`, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenRef.current}`,
          },
          body,
        });
      } catch {
        // The page is closing; nothing more to do
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if ((isDirty() && !paused.current) || inflight.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("blur", flushNow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("blur", flushNow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Leaving the editor inside the app: send what is pending.
      flushNow();
    };
  }, [enabled, isDirty, post, save]);

  /** The editor now shows this draft (or none): nothing to save yet. */
  const adopt = useCallback(
    (id: string | null, shown: TPostAPI, savedAt?: string) => {
      clearTimer();
      full.current = false;
      attempt.current = 0;
      setDraftId(id);
      savedRef.current = snapshotOf(shown, post);
      const at = savedAt ? new Date(savedAt) : null;
      setStatus(
        id && at && !Number.isNaN(at.getTime())
          ? { kind: "saved", at }
          : { kind: "idle" },
      );
    },
    [clearTimer, post, setDraftId],
  );

  /**
   * Stops autosaving (publishing, switching drafts) and waits for a save
   * that is already on its way, so nothing lands after the draft is
   * deleted. `resume()` starts again.
   */
  const pause = useCallback(async () => {
    paused.current = true;
    clearTimer();
    if (inflight.current) {
      await inflight.current;
    }
  }, [clearTimer]);

  const resume = useCallback(() => {
    paused.current = false;
    if (isDirty()) {
      timer.current = setTimeout(() => {
        void save();
      }, AUTOSAVE_DELAY_MS);
    }
  }, [isDirty, save]);

  /** The draft id right now (the state can lag a save that just ended). */
  const currentId = useCallback(() => draftIdRef.current, []);

  /** A slot was freed (or the user asked): try again now. */
  const retry = useCallback(() => {
    full.current = false;
    attempt.current = 0;
    void save();
  }, [save]);

  return {
    draftId,
    status: enabled ? status : ({ kind: "off" } as DraftStatus),
    /** Saves now if anything changed; resolves when done. */
    flush: save,
    adopt,
    retry,
    pause,
    resume,
    currentId,
    hasUnsaved: isDirty,
  };
}

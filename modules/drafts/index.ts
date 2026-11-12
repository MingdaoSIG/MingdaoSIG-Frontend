import type { TDraft, TDraftFields, TDraftSummary } from "@/interfaces/Reading";
import { apiRequest } from "@/modules/api/client";
import { storageGet, storageRemove, storageSet } from "@/utils/safeStorage";

// Cloud drafts (contract v4 §4.5): at most 20 per user (4026 when full).

export const DRAFT_LIMIT = 20;
export const DRAFT_CONTENT_MAX = 100000;

export const draftKeys = {
  list: (userId: string) => ["drafts", userId] as const,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

/** The post id a draft edits: a string, a populated post, or null. */
function postIdOf(value: unknown): string | null {
  if (typeof value === "string" && value) {
    return value;
  }
  if (isRecord(value) && typeof value._id === "string") {
    return value._id;
  }
  return null;
}

export function toDraft(value: unknown): TDraft | null {
  if (!isRecord(value) || typeof value._id !== "string") {
    return null;
  }
  return {
    _id: value._id,
    title: str(value.title),
    sig: postIdOf(value.sig) ?? "",
    content: str(value.content),
    cover: str(value.cover),
    hashtag: Array.isArray(value.hashtag)
      ? value.hashtag.filter((tag): tag is string => typeof tag === "string")
      : [],
    post: postIdOf(value.post),
    createdAt: str(value.createdAt) || undefined,
    updatedAt: str(value.updatedAt) || undefined,
  };
}

export function toDraftSummary(value: unknown): TDraftSummary | null {
  const draft = toDraft(value);
  if (!draft) {
    return null;
  }
  const { content: _content, ...rest } = draft;
  return {
    ...rest,
    excerpt: isRecord(value) ? str(value.excerpt) : "",
  };
}

export async function listDrafts(signal?: AbortSignal) {
  const result = await apiRequest<unknown>("/draft", { auth: true, signal });
  if (!result.ok) {
    return result;
  }
  const items = Array.isArray(result.data)
    ? result.data
        .map(toDraftSummary)
        .filter((item): item is TDraftSummary => item !== null)
    : [];
  return { ...result, data: items };
}

export async function getDraft(id: string, signal?: AbortSignal) {
  const result = await apiRequest<unknown>(`/draft/${id}`, {
    auth: true,
    signal,
  });
  if (!result.ok) {
    return result;
  }
  return { ...result, data: toDraft(result.data) };
}

/** Creates (no id) or updates a draft; resolves with the saved draft id. */
export async function saveDraft(id: string | null, fields: TDraftFields) {
  const result = await apiRequest<unknown>(id ? `/draft/${id}` : "/draft", {
    method: "POST",
    auth: true,
    body: fields,
  });
  if (!result.ok) {
    return result;
  }
  const saved = toDraft(result.data);
  return { ...result, data: { id: saved?._id ?? id ?? "" } };
}

export function deleteDraft(id: string) {
  return apiRequest(`/draft/${id}`, { method: "DELETE", auth: true });
}

// The draft a new-post editor is working on, per user, so a reload or a
// trip to another page comes back to it.

function currentKey(userId: string) {
  return `mdsig-cloud-draft:${userId}`;
}

export function rememberDraft(userId: string, id: string | null) {
  if (!userId) {
    return;
  }
  if (id) {
    storageSet(currentKey(userId), id);
  } else {
    storageRemove(currentKey(userId));
  }
}

export function rememberedDraft(userId: string) {
  return userId ? storageGet(currentKey(userId)) : null;
}

// The one-time offer to upload a draft kept on this device (contract v4
// §4.5): asked once per user and device.

function offeredKey(userId: string) {
  return `mdsig-local-draft-offered:${userId}`;
}

export function localDraftOffered(userId: string) {
  return storageGet(offeredKey(userId)) === "1";
}

export function markLocalDraftOffered(userId: string) {
  storageSet(offeredKey(userId), "1");
}

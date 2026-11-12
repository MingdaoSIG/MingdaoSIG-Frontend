/**
 * Hashtags are stored with or without a leading `#`. Everything the UI
 * shows or links works on the bare tag.
 */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "").trim();
}

/** `/tag/<tag>` for a stored hashtag, or null for an empty one. */
export function tagHref(tag: string): string | null {
  const bare = normalizeTag(tag);
  return bare ? `/tag/${encodeURIComponent(bare)}` : null;
}

/** Tags of a post, bare, without empties or duplicates (case-insensitive). */
export function postTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }
    const bare = normalizeTag(tag);
    const key = bare.toLowerCase();
    if (bare && !seen.has(key)) {
      seen.add(key);
      result.push(bare);
    }
  }
  return result;
}

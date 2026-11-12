/** The backend takes 1–100 characters (contract v3 §4.3). */
export const SEARCH_MAX_LENGTH = 100;

/** `/search?q=…` for a query, or the empty search page. */
export function searchHref(q: string) {
  const query = q.trim().slice(0, SEARCH_MAX_LENGTH);
  return query ? `/search?q=${encodeURIComponent(query)}` : "/search";
}

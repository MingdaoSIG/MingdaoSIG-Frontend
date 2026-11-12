"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// Filters, sorting and the page number live in the URL query, so back and
// forward step through them and a copied link opens the same view.

type Value = string | number | null | undefined;

export function useQueryState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback(
    (key: string, fallback: string = "") => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  /**
   * Updates some keys; an empty value removes the key. A filter change
   * goes back to page 1 unless `keepPage` is set. Typing in a search box
   * should `replace` the entry instead of adding one per keystroke.
   */
  const set = useCallback(
    (
      updates: Record<string, Value>,
      options: { replace?: boolean; keepPage?: boolean } = {},
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      if (!options.keepPage && !("page" in updates)) {
        params.delete("page");
      }
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (options.replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [searchParams, pathname, router],
  );

  /** 1-based page from `?page=`, at least 1. */
  const page = Math.max(1, Number.parseInt(get("page", "1"), 10) || 1);

  return { get, set, page, searchParams };
}

/** Picks the value when it is one of the allowed ones, else the default. */
export function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

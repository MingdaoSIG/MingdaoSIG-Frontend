import type { MetadataRoute } from "next";

import { SITE_URL } from "@/modules/site";

// /sitemap.xml from the backend's sitemap feed (contract v3 §4.6). Built
// per request (the backend caches the feed for 10 minutes and the fetch
// is cached as long), so `next build` never calls the API. When the feed
// is missing or broken the sitemap still lists the static pages.

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FETCH_TIMEOUT_MS = 8000;

type SitemapFeed = {
  posts?: { _id?: unknown; updatedAt?: unknown }[];
  sigs?: { customId?: unknown }[];
  users?: { customId?: unknown; updatedAt?: unknown }[];
};

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
  { url: `${SITE_URL}/info`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${SITE_URL}/data`, changeFrequency: "monthly", priority: 0.3 },
  { url: `${SITE_URL}/dashboard`, changeFrequency: "daily", priority: 0.3 },
  { url: `${SITE_URL}/changelog`, changeFrequency: "weekly", priority: 0.2 },
];

function lastModified(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

async function fetchFeed(): Promise<SitemapFeed | null> {
  if (!API_URL) {
    return null;
  }
  try {
    const response = await fetch(`${API_URL}/post/sitemap`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as {
      status?: number;
      data?: SitemapFeed;
    } | null;
    if (body?.status !== 2000 || typeof body.data !== "object") {
      return null;
    }
    return body.data ?? null;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const feed = await fetchFeed();
  if (!feed) {
    return STATIC_PAGES;
  }
  const entries: MetadataRoute.Sitemap = [...STATIC_PAGES];

  for (const post of Array.isArray(feed.posts) ? feed.posts : []) {
    if (isString(post?._id) && /^[0-9a-f]{24}$/i.test(post._id)) {
      entries.push({
        url: `${SITE_URL}/post/${post._id}`,
        lastModified: lastModified(post.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }
  for (const sig of Array.isArray(feed.sigs) ? feed.sigs : []) {
    if (isString(sig?.customId)) {
      entries.push({
        url: `${SITE_URL}/@${encodeURIComponent(sig.customId)}`,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  }
  for (const user of Array.isArray(feed.users) ? feed.users : []) {
    if (isString(user?.customId)) {
      entries.push({
        url: `${SITE_URL}/@${encodeURIComponent(user.customId)}`,
        lastModified: lastModified(user.updatedAt),
        changeFrequency: "weekly",
        priority: 0.4,
      });
    }
  }
  return entries;
}

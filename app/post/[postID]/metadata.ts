import type { Metadata } from "next";

import type { TThread } from "@/interfaces/Thread";
import { imageUrl } from "@/modules/imageUrl";
import markdownToPlainText from "@/modules/markdownToPlainText";
import { SITE_TITLE_SUFFIX, SITE_URL } from "@/modules/site";
import { isValidObjectId, sanitizeUrlParam } from "@/modules/validation";

// Share previews for /post/[postID] (contract v3 §4.7): the post's title,
// a ~120 character excerpt and its cover. Anything that goes wrong (bad
// id, 404, removed post, backend down) gives {}, so the layout's default
// metadata is used.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DESCRIPTION_LENGTH = 120;
const FETCH_TIMEOUT_MS = 4000;
const DEFAULT_IMAGE = `${SITE_URL}/images/banner.png`;
const FALLBACK_DESCRIPTION = "在 MDSIG 閱讀這篇貼文。";

/** The first ~120 characters of the post as plain text. */
export function excerptOf(post: Pick<TThread, "excerpt" | "content">) {
  const raw =
    typeof post.excerpt === "string" && post.excerpt.trim()
      ? post.excerpt
      : markdownToPlainText(post.content ?? "");
  const text = raw.replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  if (chars.length <= DESCRIPTION_LENGTH) {
    return text;
  }
  return `${chars.slice(0, DESCRIPTION_LENGTH).join("").trimEnd()}…`;
}

async function fetchPost(id: string): Promise<TThread | null> {
  if (!API_URL) {
    return null;
  }
  try {
    const response = await fetch(`${API_URL}/post/${id}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const body: unknown = await response.json();
    const data = (body as { status?: number; data?: TThread } | null)?.data;
    if (
      (body as { status?: number } | null)?.status !== 2000 ||
      typeof data?._id !== "string" ||
      typeof data.title !== "string" ||
      data.removed === true
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function postMetadata(rawId: string): Promise<Metadata> {
  let id: string;
  try {
    id = sanitizeUrlParam(decodeURIComponent(rawId));
  } catch {
    return {};
  }
  if (!isValidObjectId(id)) {
    return {};
  }
  const post = await fetchPost(id);
  if (!post) {
    return {};
  }

  const title = `${post.title}${SITE_TITLE_SUFFIX}`;
  const description = excerptOf(post) || FALLBACK_DESCRIPTION;
  const cover = typeof post.cover === "string" ? imageUrl(post.cover) : null;
  const image = cover || DEFAULT_IMAGE;
  const path = `/post/${id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      url: path,
      siteName: "MDSIG",
      locale: "zh_TW",
      title,
      description,
      images: [{ url: image }],
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image,
    },
    other: {
      "twitter:url": `${SITE_URL}${path}`,
    },
  };
}

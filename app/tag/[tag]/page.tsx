import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { normalizeTag } from "@/modules/hashtag";
import { SITE_TITLE_SUFFIX } from "@/modules/site";

import TagPage from "./TagPage";

type Props = { params: Promise<{ tag: string }> };

/** Matches the backend's limit on queries. */
const TAG_MAX_LENGTH = 100;

function readTag(raw: string) {
  try {
    const tag = normalizeTag(decodeURIComponent(raw));
    return tag.length <= TAG_MAX_LENGTH ? tag : "";
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = readTag((await params).tag);
  if (!tag) {
    return {};
  }
  return {
    title: `#${tag}${SITE_TITLE_SUFFIX}`,
    description: `MDSIG 上標記 #${tag} 的貼文`,
    alternates: { canonical: `/tag/${encodeURIComponent(tag)}` },
  };
}

export default async function Page({ params }: Props) {
  const tag = readTag((await params).tag);
  if (!tag) {
    notFound();
  }
  return <TagPage tag={tag} />;
}

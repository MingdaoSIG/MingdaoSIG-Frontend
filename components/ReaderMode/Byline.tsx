"use client";

import Image from "next/image";
import Link from "next/link";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { TThread } from "@/interfaces/Thread";
import markdownToPlainText from "@/modules/markdownToPlainText";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";

// Author line shown under the title in reader mode, where the side
// column (author card) is hidden. Uses the shared react-query hooks so
// it reuses cached user/SIG data instead of issuing extra requests.

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/g;

function readingMinutes(markdown: string) {
  const text = markdownToPlainText(markdown ?? "");
  const cjkChars = text.match(CJK)?.length ?? 0;
  const latinWords = text.replace(CJK, " ").split(/\s+/).filter(Boolean);
  // ~400 CJK characters or ~200 English words per minute
  return Math.max(1, Math.round(cjkChars / 400 + latinWords.length / 200));
}

export default function ReaderByline({ post }: { post: TThread }) {
  const { data: user } = useUser(post.user);
  const { data: sig } = useSig(post.sig);

  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("zh-TW")
    : "";

  return (
    <div className="reader-byline">
      {user?.avatar && (
        <Image
          src={user.avatar}
          width={32}
          height={32}
          alt=""
          className="reader-byline-avatar"
        />
      )}
      {user && (
        <Link href={`/@${user.customId}`} className="reader-byline-author">
          {user.name}
        </Link>
      )}
      {sig && (
        <Link
          href={`/@${sig.customId}`}
          className="sig-text font-semibold"
          style={{
            ["--sig-color" as string]: sigDefaultColors[sig._id ?? ""],
          }}
        >
          {sig.name}
        </Link>
      )}
      {date && <span>{date}</span>}
      <span>約 {readingMinutes(post.content)} 分鐘閱讀</span>
    </div>
  );
}

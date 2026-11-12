"use client";

import { Compass, Users } from "lucide-react";
import Link from "next/link";
import { useMySigs } from "@/utils/useMySigs";

/**
 * The 「我的 SIG」 tab with nothing to show. In no SIG: say so and lead to
 * 探索, where SIGs can be followed or joined. In SIGs without posts yet:
 * just say that.
 */
export function MySigEmpty({ mobile = false }: { mobile?: boolean }) {
  const { sigs } = useMySigs();
  const inSig = sigs.length > 0;

  return (
    <section
      data-mysig-empty={inSig ? "no-posts" : "no-sig"}
      className={`flex flex-col items-center rounded-card border border-line bg-surface text-center shadow-card ${
        mobile ? "gap-2 px-4 py-8" : "gap-2 px-8 py-10"
      }`}
    >
      <span className="mb-1 inline-flex size-11 items-center justify-center rounded-control bg-brand-50 text-brand-700">
        <Users size={22} aria-hidden />
      </span>
      {inSig ? (
        <>
          <h2 className="font-semibold text-ink-900">你的 SIG 還沒有貼文</h2>
          <p className="text-ink-500 text-sm">
            你加入或追蹤的 SIG 有新貼文時，會出現在這裡。
          </p>
        </>
      ) : (
        <>
          <h2 className="font-semibold text-ink-900">
            你還沒有加入或追蹤任何 SIG
          </h2>
          <p className="text-ink-500 text-sm">
            追蹤有興趣的 SIG，這裡就會列出它們的新貼文。
          </p>
          <Link
            href="/explore"
            className="mt-2 flex h-11 items-center gap-1.5 rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
          >
            <Compass size={16} aria-hidden />
            探索 SIG
          </Link>
        </>
      )}
    </section>
  );
}

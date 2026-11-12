"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import {
  ANNOUNCEMENT_SIG_ID,
  managedSigIdsOf,
  useSigDirectory,
} from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";

/**
 * The 「我的 SIG」 tab with nothing to show. In no SIG: say so and lead to
 * the SIG list (on phones the 探索 SIG sheet, on desktop the SIGs
 * themselves). In SIGs without posts yet: just say that.
 */
export function MySigEmpty({
  mobile = false,
  onBrowseSigs,
}: {
  mobile?: boolean;
  /** Phones: opens the SIG list sheet. */
  onBrowseSigs?: () => void;
}) {
  const { userData } = useUserAccount();
  const directory = useSigDirectory();
  const userId = userData?._id ?? "";
  const sigs = (directory.data ?? []).filter(
    (sig) => sig._id !== ANNOUNCEMENT_SIG_ID && sig.customId,
  );
  const inSig =
    (userData?.sig?.length ?? 0) > 0 ||
    managedSigIdsOf(directory.data ?? [], userId).length > 0;

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
            你加入的 SIG 有新貼文時，會出現在這裡。
          </p>
        </>
      ) : (
        <>
          <h2 className="font-semibold text-ink-900">你還沒有加入任何 SIG</h2>
          <p className="text-ink-500 text-sm">
            加入 SIG 後，這裡會列出你的 SIG 的新貼文。
          </p>
          {mobile ? (
            <button
              type="button"
              className="mt-2 h-11 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white"
              onClick={onBrowseSigs}
            >
              探索 SIG
            </button>
          ) : (
            sigs.length > 0 && (
              <nav
                aria-label="SIG 列表"
                className="mt-3 flex max-w-2xl flex-wrap justify-center gap-2"
              >
                {sigs.map((sig) => (
                  <Link
                    key={sig._id}
                    href={`/@${sig.customId}`}
                    className="rounded-control border-[1.5px] border-[var(--sig-color)] bg-surface px-3 py-1.5 font-semibold text-ink-800 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--sig-color)_8%,white)]"
                    style={{
                      ["--sig-color" as string]:
                        resolveSigColor(sig) ?? BRAND_COLOR,
                    }}
                  >
                    {sig.name}
                  </Link>
                ))}
              </nav>
            )
          )}
        </>
      )}
    </section>
  );
}

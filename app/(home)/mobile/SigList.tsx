"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/mobile/BottomSheet";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
// Modules
import maxMatch from "@/modules/maxMatch";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";

const SIG = (child: Pick<Sig, "_id" | "name" | "customId" | "color">) => {
  // No link until the SIG has an id to link to (never "/@undefined").
  if (!child.customId) {
    return null;
  }
  return (
    <Link
      className="relative flex h-20 w-20 flex-shrink-0 flex-wrap content-center items-center justify-center rounded-control border-[1.5px] border-[var(--sig-color)] bg-surface p-1 text-center font-semibold text-[13px] text-ink-800 leading-snug transition duration-150 active:bg-[color-mix(in_srgb,var(--sig-color)_8%,white)]"
      style={{
        ["--sig-color" as string]: resolveSigColor(child) ?? BRAND_COLOR,
      }}
      href={`/@${child.customId}`}
    >
      {/* Words stay whole but share lines (one word per line read as
          機器人／設計／與／製造). */}
      {maxMatch(child.name ?? "").map((name) => (
        <span key={name} className="whitespace-nowrap">
          {name}
        </span>
      ))}
    </Link>
  );
};

type SigListProps = {
  open: boolean;
  onClose: () => void;
};

const SigList = ({ open, onClose }: SigListProps) => {
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    (async () => {
      const result = await apiRequest<Sig[]>("/sig/list", {
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      if (result.ok && Array.isArray(result.data)) {
        setSigs(result.data.filter((sig) => sig && typeof sig === "object"));
        setError(null);
      } else {
        setError(result.ok ? "SIG 列表載入失敗，請稍後再試" : result.message);
      }
      setIsLoading(false);
    })();
    return () => controller.abort();
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="探索 SIG"
      snapPoints={["60%", "90%"]}
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line-strong border-t-brand-700" />
        </div>
      ) : error ? (
        <p role="alert" className="py-10 text-center text-ink-500 text-sm">
          {error}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 place-items-center gap-4">
            {sigs.map((item) => {
              if (item._id !== "652d60b842cdf6a660c2b778") {
                return (
                  <SIG
                    _id={item._id}
                    name={item.name}
                    customId={item.customId}
                    key={item._id}
                  />
                );
              }
              return null;
            })}
          </div>
          <p className="mt-6 text-center text-ink-500 text-xs">
            選擇一個 SIG 來探索更多內容
          </p>
        </>
      )}
    </BottomSheet>
  );
};

export default SigList;

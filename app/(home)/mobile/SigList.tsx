"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/mobile/BottomSheet";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { Sig } from "@/interfaces/Sig";
// Modules
import maxMatch from "@/modules/maxMatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: Pick<Sig, "_id" | "name" | "customId">) => {
  return (
    <Link
      className="relative flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-control border-[1.5px] border-[var(--sig-color)] bg-surface p-2 transition duration-150 active:bg-[color-mix(in_srgb,var(--sig-color)_8%,white)]"
      style={{
        ["--sig-color" as string]: sigDefaultColors[child._id] ?? "#0b5a83",
      }}
      href={`/@${child.customId}`}
    >
      {maxMatch(child.name).map((name) => (
        <p
          key={name}
          className="text-center font-semibold text-ink-800 text-xs leading-4"
        >
          {name}
        </p>
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

  useEffect(() => {
    if (!open) {
      return;
    }
    (async () => {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/list`, { method: "GET" })
        ).json();
        setSigs(res.data);
        setIsLoading(false);
      } catch (_error) {
        setIsLoading(false);
      }
    })();
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="探索 SIGs"
      snapPoints={["60%", "90%"]}
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line-strong border-t-brand-700" />
        </div>
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

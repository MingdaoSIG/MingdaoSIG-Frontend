"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/mobile/BottomSheet";
import type { Sig } from "@/interfaces/Sig";
// Modules
import maxMatch from "@/modules/maxMatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: Pick<Sig, "_id" | "name" | "customId">) => {
  return (
    <Link
      className="group relative flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#6fa8ff] via-[#4a9dd4] to-[#30b4ac] p-2 transition-all duration-300 hover:rotate-3 hover:scale-110 hover:shadow-lg"
      href={`/@${child.customId}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
      {maxMatch(child.name).map((name) => (
        <p
          key={name}
          className="relative z-10 text-center font-semibold text-white text-xs leading-3"
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6fa8ff] border-t-transparent" />
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
          <p className="mt-6 text-center text-gray-500 text-xs">
            選擇一個 SIG 來探索更多內容
          </p>
        </>
      )}
    </BottomSheet>
  );
};

export default SigList;

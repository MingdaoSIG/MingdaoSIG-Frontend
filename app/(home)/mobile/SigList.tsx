"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const SigList = ({
  sigListToggle,
}: {
  sigListToggle: (value: boolean) => void;
}) => {
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();

        setSigs(res.data);
        setIsLoading(false);
      } catch (_error) {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed top-0 left-0 z-[999999] grid h-screen w-screen animate-fadeIn place-items-center bg-black/70 backdrop-blur-sm">
      {/* Outer overlay */}
      <div
        className="absolute top-0 left-0 h-full w-full"
        onClick={() => sigListToggle(false)}
      />

      {/* Content */}
      <div className="relative w-[90vw] max-w-md animate-slideUp overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-br from-[#6fa8ff] to-[#30b4ac] px-6 py-4">
          <h2 className="font-bold text-white text-xl">探索 SIGs</h2>
          <button
            type="button"
            onClick={() => sigListToggle(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* SIG Grid */}
        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6fa8ff] border-t-transparent"></div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white/95 to-transparent px-6 py-3 text-center">
          <p className="text-gray-500 text-xs">選擇一個 SIG 來探索更多內容</p>
        </div>
      </div>
    </div>
  );
};

export default SigList;

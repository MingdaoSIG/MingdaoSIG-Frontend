"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Modules
import maxMatch from "@/modules/maxMatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: any) => {
  return (
    <Link
      className="group relative w-20 h-20 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#6fa8ff] via-[#4a9dd4] to-[#30b4ac] p-2 flex flex-col items-center justify-center hover:scale-110 hover:shadow-lg transition-all duration-300 hover:rotate-3"
      href={`/@${child.customId}`}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-colors duration-300" />
      {maxMatch(child.name).map((name, index) => (
        <p key={index} className="text-white text-xs leading-3 font-semibold relative z-10 text-center">
          {name}
        </p>
      ))}
    </Link>
  );
};

const SigList = ({ sigListToggle }: { sigListToggle: Function }) => {
  const [sigs, setSigs] = useState<any>([]);
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
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-screen bg-black/70 backdrop-blur-sm grid place-items-center z-[999999] animate-fadeIn">
      {/* Outer overlay */}
      <div
        className="w-full h-full absolute top-0 left-0"
        onClick={() => sigListToggle(false)}
      />

      {/* Content */}
      <div className="bg-white/95 backdrop-blur-xl w-[90vw] max-w-md rounded-3xl shadow-2xl relative animate-slideUp overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#6fa8ff] to-[#30b4ac] px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-white text-xl font-bold">探索 SIGs</h2>
          <button
            onClick={() => sigListToggle(false)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
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
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6fa8ff] border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 place-items-center">
              {sigs.map((item: any) => {
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
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white/95 to-transparent px-6 py-3 text-center">
          <p className="text-gray-500 text-xs">
            選擇一個 SIG 來探索更多內容
          </p>
        </div>
      </div>
    </div>
  );
};

export default SigList;
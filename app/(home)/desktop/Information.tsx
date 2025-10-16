"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// APIs Request Function
import { useTopPost } from "@/utils/usePost";
import type { TThread } from "@/interfaces/Thread";

// Modules
import maxMatch from "@/modules/maxMatch";

//Components
import { InformationSkeleton } from "@/components/Information/desktop/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: any) => {
  return (
    <Link
      className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-r from-[#6fa8ff] to-[#30b4ac] p-[0.4rem] px-1 flex flex-col items-center justify-center text-white text-sm leading-5 hover:underline hover:cursor-pointer transition-all"
      href={`/@${child.customId}`}
    >
      {maxMatch(child.name).map((name, index) => (
        <p key={index} className="text-center break-words text-xs">{name}</p>
      ))}
    </Link>
  );
};

const LikePost = (child: any) => {
  return (
    <Link
      className="flex items-center justify-between gap-4 group"
      href={`/post/${child._id}`}
    >
      <h3 className="text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 relative pb-1">
        {child.title}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full group-hover:origin-left origin-right"></span>
      </h3>
      <p className="w-12 text-right text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{child.like} likes</p>
    </Link>
  );
};

const Information = () => {
  const [sigs, setSigs] = useState<any>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();

        return setSigs(res.data);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  const pageSize = 3;
  const { data, isLoading } = useTopPost({ pageSize });

  if (isLoading) {
    return <InformationSkeleton />;
  } else {
    return (
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <div className="p-6 bg-panel-bg rounded-[1.2rem] h-full overflow-hidden relative">
          <div className="flex flex-col gap-6 w-full h-full">
            {/* Top Posts Section */}
            <div>
              <h2 className="text-lg font-bold text-[#3c69b4] leading-[1.8rem]">Top 3 Posts</h2>
              <div className="mt-1 flex flex-col gap-0.5">
                {data?.pages[0].map((item: TThread) => {
                  return (
                    <LikePost
                      _id={item._id}
                      title={item.title}
                      like={item.likes}
                      key={item._id}
                    />
                  );
                })}
              </div>
            </div>

            {/* SIGs Section */}
            <div className="flex-grow relative min-h-0">
              <h2 className="text-lg font-bold text-[#3c69b4] leading-[1.8rem]">SIGs - {sigs.length - 1}</h2>
              <div className="absolute top-[1.8rem] left-0 right-0 bottom-0 mt-1 flex flex-row flex-wrap justify-evenly items-start content-start gap-7 overflow-y-auto custom-scrollbar">
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
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Information;
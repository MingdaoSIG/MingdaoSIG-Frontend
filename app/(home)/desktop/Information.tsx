"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Styles
import style from "./Information.module.scss";

// APIs Request Function
import { useTopPost } from "@/utils/usePost";
import { TThread } from "@/interfaces/Thread";

// Modules
import maxMatch from "@/modules/maxMatch";

//Components
import { InformationSkeleton } from "@/components/Information/desktop/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: any) => {
  return (
    <Link className={style.sig} href={`/@${child.customId}`}>
      {maxMatch(child.name).map((name, index) => (
        <p key={index}>{name}</p>
      ))}
    </Link>
  );
};

const LikePost = (child: any) => {
  return (
    <Link className={style.likePost} href={`/post/${child._id}`}>
      <h3 className={style.likeTitle}>{child.title}</h3>
      <p>{child.like} likes</p>
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
        <div className={style.information}>
          <div className={style.wrapper}>
            <div className={style.likedPosts}>
              <h2>Top 3 Posts</h2>
              <div className={style.likePostWrapper}>
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

            <div className={style.sigs}>
              <h2>SIGs - {sigs.length - 1}</h2>
              <div className={style.sigTop}>
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

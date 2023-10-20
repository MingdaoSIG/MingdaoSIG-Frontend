"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Styles
import style from "./Information.module.scss";
import { homePageLinks } from "../configs/linksList";

// const Hashtag = (child: any) => {
//   return (
//     <div className="my-2 flex">
//       <h2 className="text-md-dark-green text-lg font-medium cursor-pointer hover:underline  hover:decoration-1 transition  duration-300 ease-out  ">
//         #{child.name}
//       </h2>
//       <p className="text-[#A6A6A6] text-xs ml-auto text-right my-auto">
//         23 post
//       </p>
//     </div>
//   );
// };

const SIG = (child: any) => {
  return (
    <div className={style.sig}>
      <p>{child.name}</p>
    </div>
  );
};

const LikeSIG = (child: any) => {
  const route = useRouter();

  return (
    <div
      className={style.likePost}
      onClick={() => route.push(`/post/${child._id}`)}
    >
      <h3>{child.title}</h3>
      <p>{child.like} likes</p>
    </div>
  );
};

const Information = ({ post }: { post: any }) => {
  const [sigs, setSigs] = useState<any>([]);

  useEffect(() => {
    GetSigListAPI();
    async function GetSigListAPI() {
      try {
        const res = await (
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/list`, {
            method: "GET",
          })
        ).json();
        setSigs(res.postData);
        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, []);

  if (post.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className={style.information + " rounded-[15px]"}>
          <div className="text-center text-[1.8rem]">Loading...</div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <div className={style.information}>
          <div className={style.likedPosts}>
            <h2>Top Liked Posts</h2>
            <div className={style.likePostWrapper}>
              {post
                .sort((a: any, b: any) => b.like.length - a.like.length)
                .slice(0, 5)
                .map((item: any) => {
                  return (
                    <LikeSIG
                      _id={item._id}
                      title={item.title}
                      like={item.like.length}
                      key={item._id}
                    />
                  );
                })}
            </div>
          </div>

          <div className={style.sigs}>
            <h2>SIGs - {sigs?.length}</h2>
            <div className={style.sig_top}>
              {sigs.map((item: any) => {
                if (item._id !== "652d60b842cdf6a660c2b778") {
                  return <SIG _id={item._id} name={item.name} key={item._id} />;
                }
              })}
            </div>
          </div>

          <div className={style.links}>
            {homePageLinks.map(({ href, text }, index, array) => {
              return (
                <>
                  <Link href={href} target="_blank" key={index}>
                    {text}
                  </Link>
                  {index === array.length - 1 ? "" : "•"}
                </>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
};

export default Information;

{
  /*  */
}

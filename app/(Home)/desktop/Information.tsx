"use client";

import style from "./Information.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="flex" onClick={() => route.push(`/post/${child._id}`)}>
      <h2 className="text-md-dark-green text-lg font-medium cursor-pointer hover:underline  hover:decoration-1 transition  duration-300 ease-out w-[calc(100%-50px)] truncate pt-1">
        {child.title}
      </h2>
      <p className="text-[#A6A6A6] text-xs ml-auto w-[50px] my-auto text-right">
        {child.like} likes
      </p>
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
        <div className={style.information + " rounded-[30px]"}>
          <div className="text-center text-[1.8rem]">Loading...</div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
        <div className={style.information + " rounded-[30px]"}>
          <div className={style.top_like}>
            <h2 className=" text-[rgb(60,_105,_180)] text-base text-[1.5rem] text-left mt-2">
              Top Liked Posts
            </h2>
            <div className="mt-3">
              {post
                .sort((a: any, b: any) => b.like.length - a.like.length)
                .slice(0, 3)
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

          <div className={style.sig_top + " mt-10"}>
            <h2 className=" text-[rgb(60,_105,_180)] text-base text-[1.5rem] text-left mt-2">
              SIGs - {sigs?.length()}
            </h2>
            <div className="mt-5 flex flex-row flex-wrap gap-4 overflow-auto mx-auto h-[calc(100%-50px)]">
              {sigs.map((item: any) => {
                if (item._id !== "652d60b842cdf6a660c2b778") {
                  return <SIG _id={item._id} name={item.name} key={item._id} />;
                }
              })}
            </div>
          </div>
        </div>
        <div className={style.link}>
          <Link
            href="/post/652cabdb45c0be8f82c54d9a"
            target="_blank"
            className={
              "text-blue-600 w-auto hover:text-blue-400 " + style.link_block
            }
          >
            Rule
          </Link>
          <Link
            href="#"
            // target="_blank"
            className={
              "text-blue-600 w-auto hover:text-blue-400 cursor-not-allowed " +
              style.link_block
            }
          >
            About
          </Link>
          <Link
            href="/post/652e4591d04b679afdff697e"
            target="_blank"
            className={
              "text-blue-600 w-auto hover:text-blue-400 " + style.link_block
            }
          >
            <p className="max-md:hidden">Markdown</p>
            <p className="md:hidden">MD</p>
          </Link>
        </div>
      </div>
    );
  }
};

export default Information;

"use client";

import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div
      className={style.thread}
      onClick={() => router.push("/post/" + threadData._id)}
    >
      <div className={style.left}>
        <h1 className="text-md-dark-green text-xl font-semibold mb-2">
          {threadData.title}
        </h1>
        <p className="text-ellipsis overflow-hidden h-[100px]">
          {threadData.content + "...."}
        </p>
      </div>
      <div className={style.right + " relative"}>
        <Image
          src={threadData.cover}
          alt="coverimage"
          style={{ borderRadius: "30px" }}
          objectFit="crop"
          priority
          height={250}
          width={250}
          className="absolute top-0 left-0 w-full h-full"
        ></Image>
      </div>
    </div>
  );
};

const ThreadsList = () => {
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    GetPostListAPI();

    async function GetPostListAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/post/list`, {
            method: "GET",
          })
        ).json();

        setPosts(res.postData);
        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, []);
  return (
    <div className={style.threads}>
      {posts.map((item, index) => {
        return <Thread threadData={item} key={index} />;
      })}
    </div>
  );
};

export default ThreadsList;

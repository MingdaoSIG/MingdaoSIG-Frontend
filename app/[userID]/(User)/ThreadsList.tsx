"use client";

import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";
import { Key, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div
      className={style.thread + " w-full cursor-pointer"}
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
          priority
          fill
          sizes="200px"
        ></Image>
      </div>
    </div>
  );
};

const ThreadsList = ({ posts }: { posts: any }) => {
  return (
    <div className={style.threads + " w-full"}>
      {posts?.length === 0 && (
        <div className="text-center text-[50px] m-auto">No posts yet.</div>
      )}
      {posts?.map((item: IThread, index: Key | null | undefined) => {
        return <Thread threadData={item} key={index} />;
      })}
    </div>
  );
};

export default ThreadsList;

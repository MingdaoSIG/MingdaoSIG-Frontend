"use client";

import { IThread } from "@/interface/Thread.interface";
import { ThreadsList as _ThreadsList } from "@/components/ThreadsList/ThreadsList";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ThreadsList = () => {
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    GetPostListAPI(setPosts);
  }, []);
  if (posts.length === 0) {
    return (
      <div className="flex text-[50px] text-center h-full w-full select-none">
        <p className="flex-1 h-full">No post yet.</p>
      </div>
    );
  }

  return <_ThreadsList posts={posts} height="65dvh" />;
};

export default ThreadsList;

async function GetPostListAPI(setPosts: Dispatch<SetStateAction<IThread[]>>) {
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

"use client";

import { IThread } from "@/interface/Thread.interface";
import { ThreadsList as _ThreadsList } from "@/components/ThreadsList/ThreadsList";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ThreadList = () => {
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    GetPostListAPI(setPosts);
  }, []);
  return (
    <_ThreadsList posts={posts} />
  );
};

export default ThreadList;

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
"use client";

import { IThread } from "@/interface/Thread.interface";
import { ThreadsList as _ThreadsList } from "@/components/Threads/mobile/ThreadsList";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import styles from "./Threads.module.scss";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ThreadsList = () => {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    GetPostListAPI(setPosts, setStatus);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex text-[50px] text-center h-full w-full select-none">
        <p className="flex-1 h-full">Loading...</p>
      </div>
    );
  } else if (posts.length === 0) {
    return (
      <div className="flex text-[50px] text-center h-full w-full select-none">
        <p className="flex-1 h-full">No post yet.</p>
      </div>
    );
  } else {
    return (
      <div className={styles.threadWrap}>
        <_ThreadsList posts={posts} height="100%" />
      </div>
    );
  }
};

export default ThreadsList;

async function GetPostListAPI(
  setPosts: Dispatch<SetStateAction<IThread[]>>,
  setStatus: Dispatch<SetStateAction<string>>
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list`, {
        method: "GET",
      })
    ).json();

    setPosts(res.postData);
    setStatus("success");
    return;
  } catch (error) {
    console.log(error);
  }
}

"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

// Styles
import styles from "./Threads.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";
import { ThreadsList as _ThreadsList } from "@/components/Threads/mobile/ThreadsList";
import { getPostListAPI } from "@/app/(home)/apis/getPostList";

interface Props {
  setParentPosts: Dispatch<SetStateAction<IThread[]>>;
}

const ThreadsList = ({ setParentPosts }: Props) => {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    getPostListAPI(setParentPosts, setPosts, setStatus);
  }, [setParentPosts]);

  if (status !== "loading" || posts.length > 0) {
    return (
      <div className={styles.threadWrap}>
        <_ThreadsList posts={posts} height="100%" />
      </div>
    );
  }
  return (
    <div className={styles.messagePage}>
      {status === "loading" ? <p>Loading...</p> : <p>No post yet.</p>}
    </div>
  );
};

export default ThreadsList;

"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

//Components
import { ThreadsList as _ThreadsList } from "@/components/Threads/desktop/ThreadsList";

// Styles
import styles from "./Threads.module.scss";

// Interfaces
import { IThread } from "@/interface/Thread.interface";

// APIs Request Function
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
        <_ThreadsList posts={posts} height="65dvh" />
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

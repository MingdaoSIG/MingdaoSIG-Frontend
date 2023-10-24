"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

//Components
import { ThreadsList as _ThreadsList, InfinityThreadsList } from "@/components/Threads/desktop/ThreadsList";

// Styles
import styles from "./Threads.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// APIs Request Function
import { getPostListAPI } from "@/app/(home)/apis/getPostList";
import usePosts from "@/components/usePost";

interface Props {
  setParentPosts: Dispatch<SetStateAction<IThread[]>>;
}

const ThreadsList = ({ setParentPosts }: Props) => {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState<IThread[]>([]);
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage } = usePosts({ pageSize });

  useEffect(() => {
    getPostListAPI(setParentPosts, setPosts, setStatus);
  }, [setParentPosts]);

  if (status.startsWith("loading")) {
    return (
      <div className={styles.messagePage}>
        {status === "loading" ? <p>Loading...</p> : <p>No post yet.</p>}
      </div>
    );
  } else if (posts.length > 0) {
    return (
      <div className={styles.threadWrap}>
        <InfinityThreadsList data={data} height="65dvh" fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
      </div>
    );
  }
};

export default ThreadsList;

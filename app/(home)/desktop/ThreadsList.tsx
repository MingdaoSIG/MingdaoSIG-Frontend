"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

//Components
import { ThreadsList as _ThreadsList, InfinityThreadsList, ThreadsListSkeleton } from "@/components/Threads/desktop/ThreadsList";

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

  return (
    <div className={styles.threadWrap}>
      {status === "loading" ? (
        <ThreadsListSkeleton repeat={10} height="65dvh" />
      ) : (
        <InfinityThreadsList data={data} height="65dvh" fetchNextPage={fetchNextPage} isFetchingNextPage={isFetchingNextPage} />
      )}
    </div>
  );
};

export default ThreadsList;

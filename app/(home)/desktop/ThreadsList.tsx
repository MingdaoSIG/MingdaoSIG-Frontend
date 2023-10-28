"use client";

import { Dispatch, SetStateAction } from "react";

//Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

// Styles
import styles from "./Threads.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// APIs Request Function
import { useAllPost } from "@/utils/usePost";

interface Props {
  setParentPosts: Dispatch<SetStateAction<IThread[]>>;
}

const ThreadsList = () => {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
  });

  return (
    <div className={styles.threadWrap}>
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="65dvh" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="65dvh"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
};

export default ThreadsList;

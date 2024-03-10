"use client";

//Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

// Styles
import styles from "./Threads.module.scss";

// APIs Request Function
import { useAllPost } from "@/utils/usePost";

const ThreadsList = () => {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
  });

  return (
    <div className={styles.threadWrap}>
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
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

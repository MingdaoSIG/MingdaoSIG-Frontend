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
import SwitchButton from "./SwitchButton";
import { useState } from "react";

const ThreadsList = () => {
  const [dataType, setDataType] = useState("top");
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
    sort: dataType,
  });

  async function callback(index: number) {
    if (index === 0) {
      setDataType("top");
    } else if (index === 1) {
      setDataType("latest");
    }
  }

  return (
    <div className={styles.threadWrap}>
      <SwitchButton callback={callback} />
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="65dvh"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          dataType={dataType}
        />
      )}
    </div>
  );
};

export default ThreadsList;

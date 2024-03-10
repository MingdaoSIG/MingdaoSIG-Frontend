"use client";
import { useState } from "react";

//Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import SigList from "./SigList";

// Styles
import styles from "./Threads.module.scss";

// Interfaces
import { useAllPost } from "@/utils/usePost";
import SwitchButton from "./ButtonTools";

const ThreadsList = () => {
  const [showList, setShowList] = useState(false);

  const [dataType, setDataType] = useState("latest");
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
    sort: dataType,
  });

  async function switchListType(index: number) {
    if (index === 0) {
      setDataType("top");
    } else if (index === 1) {
      setDataType("latest");
    }
  }

  return (
    <div className={styles.threadWrap}>
      {showList ? <SigList sigListToggle={setShowList} /> : <></>}
      <SwitchButton
        switchCallback={switchListType}
        sigListCallback={setShowList}
      ></SwitchButton>
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="auto"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
        />
      )}
    </div>
  );
};

export default ThreadsList;

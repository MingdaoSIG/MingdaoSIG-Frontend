"use client";

//Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/desktop/ThreadsList";

import Image from "next/image";

// Styles
import styles from "./Threads.module.scss";

// APIs Request Function
import { useAllPost, useSigPost } from "@/utils/usePost";

const ThreadsList = () => {
  const pageSize = 10;
  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
  });
  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", { pageSize: 1, sort: "latest" });

  return (
    <div className={styles.threadWrap}>
      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <>
          <div className="h-[25dvh] w-[100%] rounded-full">
            <img src={"/images/sig_banner-04.svg"} alt="banner" className="h-full w-auto" />
          </div>
          <InfinityThreadsList
            data={data}
            height="50dvh"
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            announcementData={announcementData}
          />
        </>
      )}
    </div>
  );
};

export default ThreadsList;

"use client";
import { useState } from "react";

// Components
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
import SigList from "./SigList";
import SwitchButton from "./ButtonTools";

// Interfaces
import { useAllPost, useSigPost } from "@/utils/usePost";

const ThreadsList = () => {
  const [showList, setShowList] = useState(false);
  const [dataType, setDataType] = useState("latest");
  const pageSize = 10;

  const { data, fetchNextPage, isFetchingNextPage, isLoading } = useAllPost({
    pageSize,
    sort: dataType,
  });

  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });

  async function switchListType(index: number) {
    if (index === 0) {
      setDataType("top");
    } else if (index === 1) {
      setDataType("latest");
    }
  }

  return (
    <div className="w-full h-auto pt-16 pb-16 px-2 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-y-auto scrollbar-hide">
      {showList && <SigList sigListToggle={setShowList} />}

      <SwitchButton
        switchCallback={switchListType}
        sigListCallback={setShowList}
      />

      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="calc(100dvh - 12rem)"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          announcementData={announcementData}
        />
      )}
    </div>
  );
};

export default ThreadsList;
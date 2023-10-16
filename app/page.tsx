"use client";

// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";
import ThreadsListDesktop from "./(Home)/desktop/ThreadsList";
import Information from "./(Home)/desktop/Information";
// Mobile Components
import ThreadsListMobile from "./(Home)/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";
// Mobile Style
import stylesMobile from "@/app/(Home)/mobile/Threads.module.scss";

const Home = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <ThreadsListMobile></ThreadsListMobile>;
  } else {
    return (
      <SplitBlock>
        <div className="h-full w-full">
          <ThreadsListDesktop />
        </div>
        <div className="h-full">
          <Information />
        </div>
      </SplitBlock>
    );
  }
};

export default Home;

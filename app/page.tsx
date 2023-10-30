"use client";

// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";
import ThreadsListDesktop from "./(home)/desktop/ThreadsList";
import Information from "./(home)/desktop/Information";

// Mobile Components
import ThreadsListMobile from "./(home)/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";

const Home = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <ThreadsListMobile />;
  } else {
    return (
      <SplitBlock>
        <ThreadsListDesktop />
        <Information />
      </SplitBlock>
    );
  }
};

export default Home;

"use client";

// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";
import ThreadsListDesktop from "./(home)/desktop/ThreadsList";
import Information from "./(home)/desktop/Information";

// Mobile Components
import ThreadsListMobile from "./(home)/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";

// Mobile Style
import { useState } from "react";

const Home = () => {
  const isMobile = useIsMobile();
  const [post, setPosts] = useState<any>([]);

  if (isMobile) {
    return <ThreadsListMobile setParentPosts={setPosts}></ThreadsListMobile>;
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

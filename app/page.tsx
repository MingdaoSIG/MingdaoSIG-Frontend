"use client";

// Infinity scroll
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

// Desktop Components
import SplitBlock from "./(Layout)/splitBlock";
import ThreadsListDesktop from "./(home)/desktop/ThreadsList";
import Information from "./(home)/desktop/Information";

// Mobile Components
import ThreadsListMobile from "./(home)/mobile/ThreadsList";
import useIsMobile from "@/utils/useIsMobile";

// Mobile Style
import { useState } from "react";

const queryClient = new QueryClient();

const Home = () => {
  const isMobile = useIsMobile();
  const [post, setPosts] = useState<any>([]);

  if (isMobile) {
    return <ThreadsListMobile setParentPosts={setPosts}></ThreadsListMobile>;
  } else {
    return (
      <QueryClientProvider client={queryClient}>
        <SplitBlock>
          <div className="h-full w-full">
            <ThreadsListDesktop setParentPosts={setPosts} />
          </div>
          <div className="h-full">
            <Information post={post} />
          </div>
        </SplitBlock>
      </QueryClientProvider>
    );
  }
};

export default Home;

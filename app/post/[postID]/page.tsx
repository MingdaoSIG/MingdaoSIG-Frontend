"use client";
import { useEffect, useState, use } from "react";

// Layout
import SplitBlock from "@/app/(Layout)/splitBlock";

// Desktop-Side Component
import ThreadDesktop from "@/app/post/[postID]/(post)/desktop/Thread";
import ThreadInfo from "./(post)/desktop/ThreadInfo";

// Mobile-Side Component
import ThreadMobile from "./(post)/mobile/Thread";

// Interfaces
import type { TThread } from "@/interfaces/Thread";

// Utils
import useIsMobile from "@/utils/useIsMobile";

import { NotFound } from "@/components/NotFound";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Post = ({ params }: { params: Promise<{ postID: string }> }) => {
  const isMobile = useIsMobile();

  // Unwrap the params Promise using React.use()
  const unwrappedParams = use(params);
  const PostID = decodeURIComponent(unwrappedParams.postID);

  const [post, setPost] = useState<TThread>();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    GetPostListAPI();

    async function GetPostListAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/post/${PostID}`, {
            method: "GET",
          })
        ).json();
        if (res.status === 4000 || res.status === 4008 || res.status === 4018) {
          setStatus("notfound");
        } else {
          setPost(res.data);
          setStatus("success");
        }

        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, [PostID]);

  if (status === "loading") {
    return <div></div>;
  } else if (status === "notfound") {
    return (
      <NotFound
        content={{
          message: "Post Not Found",
        }}
        image={{
          show: false,
        }}
      />
    );
  } else if (post?.sig === "652d60b842cdf6a660c2b778") {
    return isMobile ? (
      <>
        <ThreadMobile post={post!} isAnnouncement />
      </>
    ) : (
      <ThreadDesktop post={post!} />
    );
  } else {
    return isMobile ? (
      <>
        <ThreadMobile post={post!}></ThreadMobile>
      </>
    ) : (
      <SplitBlock>
        <ThreadDesktop post={post!} />
        <ThreadInfo post={post!} />
      </SplitBlock>
    );
  }
};

export default Post;
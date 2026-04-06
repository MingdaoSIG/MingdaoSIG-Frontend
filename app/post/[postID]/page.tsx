"use client";
import { use, useEffect, useState } from "react";

// Layout
import SplitBlock from "@/app/(Layout)/splitBlock";

// Desktop-Side Component
import ThreadDesktop from "@/app/post/[postID]/(post)/desktop/Thread";
import { NotFound } from "@/components/NotFound";
// Interfaces
import type { TThread } from "@/interfaces/Thread";
// Validation
import { isValidObjectId, sanitizeUrlParam } from "@/modules/validation";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import ThreadInfo from "./(post)/desktop/ThreadInfo";
// Mobile-Side Component
import ThreadMobile from "./(post)/mobile/Thread";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Post = ({ params }: { params: Promise<{ postID: string }> }) => {
  const isMobile = useIsMobile();

  // Unwrap the params Promise using React.use()
  const unwrappedParams = use(params);
  const rawPostID = decodeURIComponent(unwrappedParams.postID);

  // 驗證並清理 postID（防止路徑遍歷）
  const PostID = sanitizeUrlParam(rawPostID);

  const [post, setPost] = useState<TThread>();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // 驗證 PostID 格式
    if (!isValidObjectId(PostID)) {
      setStatus("notfound");
      return;
    }

    const controller = new AbortController();
    GetPostListAPI();

    async function GetPostListAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/post/${PostID}`, {
            method: "GET",
            signal: controller.signal,
          })
        ).json();
        if (res.status === 4000 || res.status === 4008 || res.status === 4018) {
          setStatus("notfound");
        } else {
          setPost(res.data);
          setStatus("success");
        }

        return;
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log(error);
        }
      }
    }

    return () => controller.abort();
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

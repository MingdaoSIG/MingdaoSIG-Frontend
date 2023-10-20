"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Layout
import SplitBlock from "@/app/(Layout)/splitBlock";

// Desktop-Side Component
import ThreadDesktop from "@/app/post/[postID]/(post)/desktop/Thread";
import ThreadInfo from "./(post)/desktop/ThreadInfo";

// Mobile-SIde Component
import ThreadMobile from "./(post)/mobile/Thread";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// Utils
import useIsMobile from "@/utils/useIsMobile";

import { PostCommentAPI } from "./(post)/apis/CommentAPI";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Post = ({ params }: { params: { postID: string } }) => {
  const route = useRouter();
  const isMobile = useIsMobile();

  const PostID = decodeURIComponent(params.postID);
  const [post, setPost] = useState<IThread>();
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState("loading");

  async function PostCommand(reply: any, content: any) {
    await PostCommentAPI(post?._id, reply, content, token);
  }

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");

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
          setPost(res.postData);
          setStatus("success");
        }

        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, [PostID]);

  if (status === "loading") {
    return <div className="flex align-middle justify-center text-[50px]">Loading...</div>;
  } else if (status === "notfound") {
    return (
      <div className="flex flex-col m-auto">
        <h1 className="text-[50px]">Post Not Found.</h1>
        <button
          className="bg-[#0090BD] bg-opacity-60 rounded-2xl w-[180px] h-[60px] block m-auto text-white mt-5 text-[20px]"
          onClick={() => {
            route.push("/");
          }}
        >
          Back to home
        </button>
      </div>
    );
  } else if (post?.sig === "652d60b842cdf6a660c2b778") {
    return <ThreadDesktop post={post!} />;
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

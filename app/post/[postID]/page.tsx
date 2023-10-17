"use client";

import SplitBlock from "@/app/(Layout)/splitBlock";
import Thread from "@/app/post/(Post)/Thread";
import ThreadInfo from "@/app/post/(Post)/ThreadInfo";
import { IThread } from "@/interface/Thread.interface";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Post = ({ params }: { params: { postID: string } }) => {
  const route = useRouter();

  const PostID = decodeURIComponent(params.postID);
  const [post, setPost] = useState<IThread>();
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
        if (res.status === 4000 || res.status === 4008) {
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
    return <div className="flex m-auto text-[50px]">Loading...</div>;
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
    return <Thread post={post!} />;
  } else {
    return (
      <>
        <SplitBlock>
          <Thread post={post!} />
          <ThreadInfo post={post!} />
        </SplitBlock>
      </>
    );
  }
};

export default Post;

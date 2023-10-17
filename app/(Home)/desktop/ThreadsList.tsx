"use client";

import { IThread } from "@/interface/Thread.interface";
import { ThreadsList as _ThreadsList } from "@/components/Threads/desktop/ThreadsList";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ThreadsList = ({ setParentPosts }: { setParentPosts: any }) => {
  const [status, setStatus] = useState("loading");
  const [posts, setPosts] = useState<IThread[]>([]);

  useEffect(() => {
    GetPostListAPI(setParentPosts, setPosts, setStatus);
  }, [setParentPosts]);

  if (status === "loading") {
    return (
      <div className="flex text-[50px] text-center h-full w-full select-none">
        <p className="flex-1 h-full">Loading...</p>
      </div>
    );
  } else if (posts.length === 0) {
    return (
      <div className="flex text-[50px] text-center h-full w-full select-none">
        <p className="flex-1 h-full">No post yet.</p>
      </div>
    );
  } else {
    return <_ThreadsList posts={posts} height="65dvh" />;
  }
};

export default ThreadsList;

async function GetPostListAPI(
  setParentsPost: Dispatch<SetStateAction<IThread[]>>,
  setPosts: Dispatch<SetStateAction<IThread[]>>,
  setStatus: Dispatch<SetStateAction<string>>
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list`, {
        method: "GET",
      })
    ).json();

    setParentsPost(res.postData);

    const posts: any = res.postData;
    const sortedPosts = sortPosts(posts);

    setPosts(sortedPosts);
    setStatus("success");
    return;
  } catch (error) {
    console.log(error);
  }
}

function sortPosts(posts: any[]) {
  const pinnedIds = ["652e4591d04b679afdff697e", "652cabdb45c0be8f82c54d9a"];

  posts.sort((
    a: { _id: any; like: string | any[]; },
    b: { _id: any; like: string | any[]; }
  ) => {
    const aIsTarget = pinnedIds.includes(a._id);
    const bIsTarget = pinnedIds.includes(b._id);

    if (aIsTarget === bIsTarget) {
      const aLikes = a.like.length || Math.random();
      const bLikes = b.like.length || Math.random();
      return bLikes - aLikes;
    }

    return aIsTarget ? -1 : 1;
  });

  return posts;
}
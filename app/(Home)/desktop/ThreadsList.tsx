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

    const _res: any = res.postData;
    let index2 = _res.findIndex(
      (obj: any) => obj._id === "652e4591d04b679afdff697e"
    );
    if (index2 !== -1) {
      let pinObject = _res.splice(index2, 1)[0];
      _res.unshift(pinObject);
    }
    let index = _res.findIndex(
      (obj: any) => obj._id === "652cabdb45c0be8f82c54d9a"
    );

    if (index !== -1) {
      let pinObject = _res.splice(index, 1)[0];
      _res.unshift(pinObject);
    }

    setPosts(_res);
    setStatus("success");
    return;
  } catch (error) {
    console.log(error);
  }
}

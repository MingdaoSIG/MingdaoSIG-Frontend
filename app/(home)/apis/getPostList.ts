import type { Dispatch, SetStateAction } from "react";

// Interfaces
import type { TThread } from "@/interfaces/Thread";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getPostListAPI(
  setParentsPost: Dispatch<SetStateAction<TThread[]>>,
  setPosts: Dispatch<SetStateAction<TThread[]>>,
  setStatus: Dispatch<SetStateAction<string>>,
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list`, {
        method: "GET",
      })
    ).json();

    setParentsPost(res.data);

    const posts: any = res.data;
    setPosts(posts);
    setStatus("success");
    return;
  } catch (error) {
    console.log(error);
  }
}

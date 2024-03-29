import { Dispatch, SetStateAction } from "react";

// Interfaces
import { TThread } from "@/interfaces/Thread";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getPostListAPI(
  setParentsPost: Dispatch<SetStateAction<TThread[]>>,
  setPosts: Dispatch<SetStateAction<TThread[]>>,
  setStatus: Dispatch<SetStateAction<string>>
) {
  try {
    const res = await (
      await fetch(`${API_URL}/post/list`, {
        method: "GET",
      })
    ).json();

    setParentsPost(res.data);

    const posts: any = res.data;
    // const sortedPosts = sortPosts(posts);

    // setPosts(sortedPosts);
    setPosts(posts);
    setStatus("success");
    return;
  } catch (error) {
    console.log(error);
  }
}

function sortPosts(posts: any[]) {
  const pinnedIds = [
    "652cabdb45c0be8f82c54d9a",
    "65325fce0b891d1f6b5b3131",
    "652e4591d04b679afdff697e",
  ];

  posts.sort(
    (
      a: { _id: any; like: string | any[] },
      b: { _id: any; like: string | any[] }
    ) => {
      const aIsTarget = pinnedIds.includes(a._id);
      const bIsTarget = pinnedIds.includes(b._id);

      if (aIsTarget === bIsTarget) {
        const aLikes = a.like.length || Math.random();
        const bLikes = b.like.length || Math.random();
        return bLikes - aLikes;
      }

      return aIsTarget ? -1 : 1;
    }
  );

  return posts;
}

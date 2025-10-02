// Interfaces
import type { TThread } from "@/interfaces/Thread";

export async function getPostCommentAPI({ _id }: TThread) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/comment/list/post/${_id}`,
      {
        method: "GET",
      },
    );
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}

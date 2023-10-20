export async function PostCommentAPI(
  post: any,
  reply: any,
  content: any,
  token: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      post: post,
      reply: reply,
      content: content,
    }),
  });
  return await res.json();
}

export async function GetCommentAPI({ _id }: { _id: any }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/comment/list/post/${_id}`,
    {
      method: "GET",
    }
  );
  return await res.json();
}

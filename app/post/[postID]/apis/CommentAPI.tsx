export async function PostCommentAPI(
  post: any,
  reply: any,
  content: any,
  token: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post`, {
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

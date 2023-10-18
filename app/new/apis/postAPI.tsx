import { TPostAPI } from "@/app/new/types/postAPI";

export async function postAPI(
  { title, sig, hashtag, content, cover }: TPostAPI,
  token: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: title,
      sig: sig,
      hashtag: hashtag,
      content: content,
      cover: cover,
    }),
  });
  return await res.json();
}

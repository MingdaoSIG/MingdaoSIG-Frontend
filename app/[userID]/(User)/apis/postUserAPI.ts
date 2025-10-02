// Types
import type { TPostUserAPI } from "@/app/[userID]/(User)/types/postUserAPI";

export async function postUser({ description }: TPostUserAPI, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      description: description?.toString(),
    }),
  });
  return await res.json();
}

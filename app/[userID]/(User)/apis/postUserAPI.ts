// Types
import { TPostUserAPI } from "@/app/[userID]/(User)/types/postUserAPI";

export async function postUser(
  { description }: TPostUserAPI,
  token: string
) {
  console.log(token);
  console.log(description);
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

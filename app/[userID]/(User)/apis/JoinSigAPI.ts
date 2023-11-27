import { TJoinSigAPI } from "@/app/[userID]/(User)/types/joinSigAPI";

export async function JoinSigAPI(
  { sig, q1, q2, q3 }: TJoinSigAPI,
  token: string
) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sig/${sig}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      q1: q1,
      q2: q2,
      q3: q3,
    }),
  });
  return await res.json();
}

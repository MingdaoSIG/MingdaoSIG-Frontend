import request from "./_request";

export default async function getUserData(
  userId: string
) {
  return await request.get(`${process.env.NEXT_PUBLIC_API_URL}/user/${userId}`);
}
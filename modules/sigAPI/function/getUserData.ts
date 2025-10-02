import request from "./_request";

export default async function getUserData(userId: string) {
  return await request.get("default", `/user/${userId}`);
}

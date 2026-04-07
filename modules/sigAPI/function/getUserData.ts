import request from "./_request";

export default async function getUserData(
  userId: string,
  signal?: AbortSignal,
) {
  return await request.get("default", `/user/${userId}`, {
    requestOption: { signal },
  });
}

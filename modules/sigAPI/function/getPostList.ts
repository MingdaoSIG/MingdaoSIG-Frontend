import request from "./_request";

export default async function getPostList() {
  return await request.get("default", "/post/list");
}

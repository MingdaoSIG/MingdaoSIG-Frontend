import request from "./_request";

export default async function getSigList() {
  return await request.get("default", "/sig/list");
}

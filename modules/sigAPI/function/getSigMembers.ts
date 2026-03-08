import request from "./_request";

export default async function getSigMembers(sigId: string, token: string) {
  return await request.get("default", `/sig/${sigId}/members`, {
    token,
  });
}

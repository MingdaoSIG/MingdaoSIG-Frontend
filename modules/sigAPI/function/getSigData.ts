import request from "./_request";

export default async function getSigData(sigId: string) {
  return await request.get("default", `/sig/${sigId}`);
}

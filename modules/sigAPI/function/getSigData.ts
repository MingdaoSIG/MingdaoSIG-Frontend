import request from "./_request";

export default async function getSigData(sigId: string, signal?: AbortSignal) {
  return await request.get("default", `/sig/${sigId}`, {
    requestOption: { signal },
  });
}

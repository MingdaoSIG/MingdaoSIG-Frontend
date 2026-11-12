import type { LimitedRequestInit, PaginationQuery } from "@/interfaces/Request";
import { ApiError, apiRequest } from "@/modules/api/client";

// Thin wrappers kept for the sigAPI module. They resolve to `data` and
// throw an ApiError (with a Traditional Chinese message) for anything that
// is not a 2000 answer with data, including 429 plain text and 502 HTML.

async function unwrap(path: string, options: Parameters<typeof apiRequest>[1]) {
  const result = await apiRequest(path, options);
  if (!result.ok) {
    throw new ApiError(result);
  }
  if (result.data === undefined || result.data === null) {
    throw new ApiError({
      ok: false,
      kind: "invalid-response",
      status: result.status,
      httpStatus: result.httpStatus,
      message: "伺服器暫時無法回應，請稍後再試",
      body: result.body,
    });
  }
  // biome-ignore lint/suspicious/noExplicitAny: callers type the payload
  return result.data as any;
}

async function get(
  _baseUrlType: "default" | "dev",
  path: string,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOption?: LimitedRequestInit & { signal?: AbortSignal };
  },
) {
  return unwrap(path, {
    token: option?.token,
    query: option?.requestQuery,
    signal: option?.requestOption?.signal ?? undefined,
  });
}

async function post(
  _baseUrlType: "default",
  path: string,
  body?: object,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOptions?: LimitedRequestInit & { signal?: AbortSignal };
  },
) {
  return unwrap(path, {
    method: "POST",
    body: body ?? {},
    token: option?.token,
    query: option?.requestQuery,
    signal: option?.requestOptions?.signal ?? undefined,
  });
}

const request = {
  get,
  post,
};
export default request;

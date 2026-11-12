import type { TThread } from "@/interfaces/Thread";
import { ApiError, apiRequest } from "@/modules/api/client";
import type { FetchThreadPage, ThreadPage } from "./InfiniteThreadList";

// `fetchPage` for InfiniteThreadList from any backend post list that
// takes `skip` / `limit` (`/post/list`, `/post/list/sig/:id`,
// `/post/list/user/:id`, `/post/list/hashtag/:tag`, `/post/list/mysig`,
// `/post/search`…). Lists that send `total` stop exactly at the end;
// the others stop at the first short page.

export function postListFetcher(
  path: string,
  query: Record<string, string | number | undefined> = {},
  /** Send the signed-in user's token (lists that depend on who asks). */
  auth: boolean = false,
): FetchThreadPage {
  return async (skip, limit, signal): Promise<ThreadPage> => {
    const result = await apiRequest<TThread[]>(path, {
      query: { ...query, skip, limit },
      signal,
      auth,
    });
    if (!result.ok) {
      throw new ApiError(result);
    }
    if (!Array.isArray(result.data)) {
      throw new ApiError({
        ok: false,
        kind: "invalid-response",
        status: result.status,
        httpStatus: result.httpStatus,
        message: "伺服器暫時無法回應，請稍後再試",
        body: result.body,
      });
    }
    const total = result.body.total;
    return {
      items: result.data,
      total: typeof total === "number" ? total : null,
    };
  };
}

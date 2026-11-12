import type { TPostAPI } from "@/components/PostEditor/types/postAPI";
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
import { sigDefaultCover } from "@/modules/sigTheme";

export function getPostAPI(postId: string, signal?: AbortSignal) {
  return apiRequest<TThread>(`/post/${postId}`, { signal });
}

/** No cover picked: the SIG's default cover (contract v4 §3.7). */
export async function editPostAPI(
  { title, sig, hashtag, content, cover }: TPostAPI,
  postId: string,
  token: string,
) {
  return apiRequest<TThread>(`/post/${postId}`, {
    method: "POST",
    token,
    body: {
      title: title,
      sig: sig,
      hashtag: hashtag,
      content: content,
      cover: cover || (await sigDefaultCover(sig)),
    },
  });
}

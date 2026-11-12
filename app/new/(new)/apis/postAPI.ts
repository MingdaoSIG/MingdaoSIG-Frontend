import type { TPostAPI } from "@/components/PostEditor/types/postAPI";
import type { TThread } from "@/interfaces/Thread";
import { apiRequest } from "@/modules/api/client";
import { sigDefaultCover } from "@/modules/sigTheme";

/** No cover picked: the SIG's default cover (contract v4 §3.7). */
export async function postAPI(
  { title, sig, hashtag, content, cover }: TPostAPI,
  token: string,
) {
  return apiRequest<TThread>("/post", {
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

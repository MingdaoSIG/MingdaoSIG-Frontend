import type { TSeries } from "@/interfaces/Reading";
import { seriesPostIds, updateSeries } from "@/modules/series";

// 「加入系列」 (contract v4 §4.4, the picker is settings/SeriesPicker): the
// post is appended to the chosen series once it is published or updated.

/** Appends the post to the series (no-op when it is already in it). */
export async function addPostToSeries(series: TSeries, postId: string) {
  const ids = seriesPostIds(series);
  if (ids.includes(postId)) {
    return { ok: true as const };
  }
  return updateSeries(series._id, { posts: [...ids, postId] });
}

/** A read count for cards and meta lines: 1234 → 「1,234」, 12345 → 「1.2 萬」. */
export function formatViews(views: number) {
  if (views >= 10000) {
    return `${(views / 10000).toFixed(views >= 100000 ? 0 : 1)} 萬`;
  }
  return views.toLocaleString("zh-TW");
}

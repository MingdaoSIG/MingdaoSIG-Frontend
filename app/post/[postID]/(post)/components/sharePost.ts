/**
 * 分享 on the post page: the system share sheet where the browser has one
 * (Web Share API), else the link is copied. Cancelling the share sheet
 * does nothing.
 */
export async function sharePost(
  title: string,
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const url = window.location.href.split("#")[0];
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // Not allowed here (no user gesture, insecure page…): copy instead.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}

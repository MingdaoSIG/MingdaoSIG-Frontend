import type { TThread } from "@/interfaces/Thread";
import markdownToPlainText from "@/modules/markdownToPlainText";

/**
 * Summary text for a post card. List items carry a plain-text `excerpt`
 * from the backend; posts without one (an older backend) fall back to
 * stripping the Markdown here.
 */
export function postSummary(post: Pick<TThread, "excerpt" | "content">) {
  if (typeof post.excerpt === "string") {
    return post.excerpt;
  }
  return markdownToPlainText(post.content ?? "");
}

/**
 * Default content of a new post: empty. The editor shows a placeholder and
 * a 「Markdown 教學」 link instead of an English sample the writer had to
 * delete first.
 */
export const markdownGuide = "";

/** The sample older versions put in new posts; drafts may still hold it. */
const LEGACY_MARKDOWN_GUIDE = `
# Welcome to MDSIG Post Editor
If you're unfamiliar with Markdown, please refer to this [tutorial](https://sig.mingdao.edu.tw/post/652e4591d04b679afdff697e).
`;

/** True for content that is only the default (or the old English sample). */
export function isDefaultContent(content: string | undefined) {
  const text = (content ?? "").trim();
  return text === markdownGuide || text === LEGACY_MARKDOWN_GUIDE.trim();
}

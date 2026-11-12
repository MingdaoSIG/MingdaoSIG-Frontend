import { Fragment } from "react";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * `text` with every case-insensitive match of the query's words in
 * <mark>. Without a query it is the text as it is.
 */
export function Highlight({
  text,
  query,
}: {
  text: string;
  query: string | undefined;
}) {
  const words = (query ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp);
  if (words.length === 0 || !text) {
    return <>{text}</>;
  }
  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark
            // biome-ignore lint/suspicious/noArrayIndexKey: split parts have no ids
            key={index}
            className="rounded-[3px] bg-warm-50 px-0.5 text-inherit shadow-[inset_0_-2px_0_rgba(185,98,15,0.45)] [box-decoration-break:clone]"
          >
            {part}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: split parts have no ids
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

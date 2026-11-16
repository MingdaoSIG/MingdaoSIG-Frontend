import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { HELP_TOKEN } from "@/modules/help/text";

// Renders the help content's two marks: `**bold**` and `[label](href)`.
// Same-site links use next/link; others open in a new tab.

export const helpLink =
  "text-brand-700 underline decoration-brand-700/30 underline-offset-[0.2em] transition-colors hover:text-brand-800 hover:decoration-current";

function renderLink(label: string, href: string, key: number) {
  const internal = href.startsWith("/") || href.startsWith("#");
  if (internal) {
    return (
      <Link key={key} href={href} className={helpLink}>
        {label}
      </Link>
    );
  }
  return (
    <a
      key={key}
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={helpLink}
    >
      {label}
    </a>
  );
}

export function parseHelpText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(HELP_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push(text.slice(last, index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key} className="font-semibold text-ink-900">
          {match[1]}
        </strong>,
      );
    } else {
      parts.push(renderLink(match[2], match[3], key));
    }
    key += 1;
    last = index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts;
}

export function HelpText({ text }: { text: string }) {
  return <Fragment>{parseHelpText(text)}</Fragment>;
}

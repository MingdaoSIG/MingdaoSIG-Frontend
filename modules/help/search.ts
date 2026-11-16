import { USER_FAQ } from "./faq";
import { GUIDE_TOPICS } from "./guide";
import { HELP_SECTIONS } from "./sections";
import { plainHelpText } from "./text";

// Client-side search over the user help: tutorial titles and steps, FAQ
// questions and answers, and the section names. Every word of the query
// must appear (case-insensitive); title matches rank first.

export type HelpHitKind = "guide" | "faq" | "page";

export type HelpHit = {
  key: string;
  kind: HelpHitKind;
  title: string;
  href: string;
  /** A short piece of text around the first match. */
  snippet: string;
};

type Entry = {
  key: string;
  kind: HelpHitKind;
  title: string;
  href: string;
  text: string;
};

let index: Entry[] | null = null;

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const topic of GUIDE_TOPICS) {
    entries.push({
      key: `guide-${topic.id}`,
      kind: "guide",
      title: topic.title,
      href: `/about/guide/${topic.id}`,
      text: [
        topic.summary,
        ...topic.steps.map((step) => step.text),
        ...(topic.tips ?? []),
      ]
        .map(plainHelpText)
        .join(" "),
    });
  }
  for (const group of USER_FAQ) {
    for (const item of group.items) {
      entries.push({
        key: `faq-${item.id}`,
        kind: "faq",
        title: item.q,
        href: `/about/faq#q-${item.id}`,
        text: item.a.map(plainHelpText).join(" "),
      });
    }
  }
  for (const section of HELP_SECTIONS) {
    entries.push({
      key: `page-${section.id}`,
      kind: "page",
      title: section.label,
      href: section.href,
      text: section.keywords,
    });
  }
  return entries;
}

function snippetOf(text: string, term: string) {
  const at = text.toLowerCase().indexOf(term);
  if (at < 0) {
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  }
  const start = Math.max(at - 18, 0);
  const end = Math.min(at + term.length + 42, text.length);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${
    end < text.length ? "…" : ""
  }`;
}

export function searchTerms(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

export function searchHelp(query: string, limit: number = 8): HelpHit[] {
  const terms = searchTerms(query);
  if (terms.length === 0) {
    return [];
  }
  index ??= buildIndex();
  const scored: { hit: HelpHit; score: number }[] = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    let score = 0;
    let ok = true;
    for (const term of terms) {
      if (title.includes(term)) {
        score += 3;
      } else if (text.includes(term)) {
        score += 1;
      } else {
        ok = false;
        break;
      }
    }
    if (!ok) {
      continue;
    }
    if (entry.kind === "page") {
      score += 0.5;
    }
    const inText = terms.find((term) => text.includes(term));
    scored.push({
      score,
      hit: {
        key: entry.key,
        kind: entry.kind,
        title: entry.title,
        href: entry.href,
        snippet: inText ? snippetOf(entry.text, inText) : "",
      },
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.hit);
}

/*
 * Inline-math delimiter rules from markdown-it-katex / Pandoc, which the
 * previous renderer used. remark-math pairs *any* two single `$`, so prices
 * such as 「NT$30,000 … NT$12,000」 would turn into a formula.
 *
 * A single `$` opens math only if the next character is not whitespace,
 * and closes it only if the previous character is not whitespace and the
 * next character is not a digit. Any `$` that cannot take part in such a
 * pair is escaped (`\$`) so remark-math leaves it alone.
 *
 * Fenced code, inline code and `$$` display blocks are left untouched.
 */

const FENCE = /^\s*(```|~~~)/;
const INLINE_CODE = /(`+)[^`]*?\1/g;

const isSpace = (ch: string | undefined) => ch === undefined || /\s/.test(ch);
const isDigit = (ch: string | undefined) => ch !== undefined && /\d/.test(ch);

/** Indices of single, unescaped `$` in a code-free text segment. */
function singleDollars(text: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== "$") {
      continue;
    }
    if (text[i + 1] === "$") {
      i++; // `$$` — display math, not ours
      continue;
    }
    let backslashes = 0;
    for (let j = i - 1; j >= 0 && text[j] === "\\"; j--) {
      backslashes++;
    }
    if (backslashes % 2 === 0) {
      out.push(i);
    }
  }
  return out;
}

function protectSegment(text: string): string {
  const dollars = singleDollars(text);
  const literal = new Set<number>();

  let k = 0;
  while (k < dollars.length) {
    const open = dollars[k];
    if (isSpace(text[open + 1])) {
      literal.add(open);
      k++;
      continue;
    }
    // first acceptable closer after the opener
    let closeAt = -1;
    for (let m = k + 1; m < dollars.length; m++) {
      const close = dollars[m];
      if (!isSpace(text[close - 1]) && !isDigit(text[close + 1])) {
        closeAt = m;
        break;
      }
    }
    if (closeAt === -1) {
      literal.add(open);
      k++;
      continue;
    }
    // dollars skipped between opener and closer are literal
    for (let m = k + 1; m < closeAt; m++) {
      literal.add(dollars[m]);
    }
    k = closeAt + 1;
  }

  if (literal.size === 0) {
    return text;
  }
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += literal.has(i) ? "\\$" : text[i];
  }
  return result;
}

function protectLine(line: string): string {
  let result = "";
  let last = 0;
  for (const match of Array.from(line.matchAll(INLINE_CODE))) {
    result += protectSegment(line.slice(last, match.index)) + match[0];
    last = (match.index ?? 0) + match[0].length;
  }
  return result + protectSegment(line.slice(last));
}

export function protectDollars(markdown: string): string {
  if (!markdown.includes("$")) {
    return markdown;
  }
  let inFence = false;
  let inDisplayMath = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (FENCE.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) {
        return line;
      }
      if (line.trim() === "$$") {
        inDisplayMath = !inDisplayMath;
        return line;
      }
      if (inDisplayMath) {
        return line;
      }
      return protectLine(line);
    })
    .join("\n");
}

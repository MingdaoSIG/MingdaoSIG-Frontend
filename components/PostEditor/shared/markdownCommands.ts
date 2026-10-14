import { EditorSelection, type Text } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

// Markdown formatting commands for the desktop editor toolbar/shortcuts.

/** Wrap each selection in `before`/`after`; toggle off if already wrapped. */
export function wrap(view: EditorView, before: string, after = before) {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to);
    const outerFrom = range.from - before.length;
    const outerTo = range.to + after.length;
    const isWrapped =
      outerFrom >= 0 &&
      state.sliceDoc(outerFrom, range.from) === before &&
      state.sliceDoc(range.to, outerTo) === after;

    if (isWrapped) {
      return {
        changes: [
          { from: outerFrom, to: range.from, insert: "" },
          { from: range.to, to: outerTo, insert: "" },
        ],
        range: EditorSelection.range(outerFrom, range.to - before.length),
      };
    }
    return {
      changes: {
        from: range.from,
        to: range.to,
        insert: before + text + after,
      },
      range: EditorSelection.range(
        range.from + before.length,
        range.to + before.length,
      ),
    };
  });
  view.dispatch(state.update(changes, { scrollIntoView: true }));
  view.focus();
  return true;
}

function selectedLines(doc: Text, from: number, to: number) {
  const lines = [];
  for (let n = doc.lineAt(from).number; n <= doc.lineAt(to).number; n++) {
    lines.push(doc.line(n));
  }
  return lines;
}

/**
 * Toggle a line prefix (`> `, `- `, `## `…) on every selected line.
 * `numbered` uses `1. 2. 3.`; `exclusive` replaces other heading levels.
 */
export function toggleLinePrefix(
  view: EditorView,
  prefix: string,
  options: { numbered?: boolean; heading?: boolean } = {},
) {
  const { state } = view;
  const changes = [];
  for (const range of state.selection.ranges) {
    const lines = selectedLines(state.doc, range.from, range.to);
    const pattern = options.numbered
      ? /^\d+\.\s/
      : options.heading
        ? /^#{1,6}\s/
        : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    const allHave = lines.every((line) =>
      options.heading ? line.text.startsWith(prefix) : pattern.test(line.text),
    );
    let index = 1;
    for (const line of lines) {
      const existing = line.text.match(pattern)?.[0] ?? "";
      const insert = allHave ? "" : options.numbered ? `${index++}. ` : prefix;
      changes.push({
        from: line.from,
        to: line.from + existing.length,
        insert,
      });
    }
  }
  view.dispatch({ changes, scrollIntoView: true });
  view.focus();
  return true;
}

/** Insert a block (code fence, table…) on its own lines at the cursor. */
export function insertBlock(view: EditorView, block: string, cursorOffset = 0) {
  const { state } = view;
  const { from, to } = state.selection.main;
  const line = state.doc.lineAt(from);
  const before = line.text.trim() === "" ? "" : "\n\n";
  const insert = `${before}${block}\n`;
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: from + before.length + cursorOffset },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

export function insertLink(view: EditorView) {
  const { state } = view;
  const { from, to } = state.selection.main;
  const text = state.sliceDoc(from, to) || "連結文字";
  const insert = `[${text}](https://)`;
  const urlStart = from + text.length + 3;
  view.dispatch({
    changes: { from, to, insert },
    selection: { anchor: urlStart, head: urlStart + "https://".length },
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

export function insertCodeBlock(view: EditorView) {
  const { state } = view;
  const { from, to } = state.selection.main;
  const selected = state.sliceDoc(from, to);
  return insertBlock(view, `\`\`\`\n${selected}\n\`\`\``, 3);
}

export function insertTable(view: EditorView) {
  return insertBlock(
    view,
    "| 欄位 1 | 欄位 2 | 欄位 3 |\n| --- | --- | --- |\n|  |  |  |",
    2,
  );
}

/** Count CJK characters + latin words (shown in the editor footer). */
export function countWords(markdown: string) {
  const cjk = markdown.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const latin = markdown
    .replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ")
    .replace(/[#>*_`~[\]()!|-]/g, " ")
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word)).length;
  return cjk + latin;
}

"use client";

import type { Dispatch, SetStateAction } from "react";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import { countWords } from "../shared/markdownCommands";
import {
  MARKDOWN_GUIDE_URL,
  useMarkdownEditor,
} from "../shared/useMarkdownEditor";
import type { TPostAPI } from "../types/postAPI";

// Mobile Markdown editor: same CodeMirror core and renderer as desktop
// (docs/redesign/redesign-2026.md §10–11). Layout keeps the previous
// "editor on top, preview below" flow.

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

// Phone toolbar: most-used first; scrolls horizontally
const TOOLBAR = [
  "bold",
  "italic",
  "underline",
  "strike",
  "h2",
  "h3",
  "bullet",
  "ordered",
  "task",
  "quote",
  "link",
  "image",
  "code",
  "codeBlock",
  "undo",
  "redo",
];

const MdEditorSync = ({ data, setPostData, token }: Props) => {
  const { hostRef, content, items, uploading, fileInputProps } =
    useMarkdownEditor({
      data,
      setPostData,
      token,
      fontSize: "16px",
      padding: "0.875rem",
    });

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Editor */}
      <div className="flex w-full flex-col overflow-hidden rounded-control border border-line-strong bg-surface">
        <div className="scrollbar-hide flex shrink-0 items-center gap-0.5 overflow-x-auto border-line border-b px-1.5 py-1">
          {TOOLBAR.map((key) => {
            const item = items[key];
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                className="flex size-10 shrink-0 items-center justify-center rounded-chip text-ink-700 active:bg-field"
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.onClick}
              >
                <item.icon size={19} aria-hidden />
              </button>
            );
          })}
          <input {...fileInputProps} />
        </div>
        <div ref={hostRef} className="h-[22rem] min-h-0 overflow-hidden" />
        <div className="flex shrink-0 items-center gap-3 border-line border-t px-3 py-1.5 text-ink-500 text-xs">
          <span className="tabular-nums">字數 {countWords(content)}</span>
          {uploading > 0 && (
            <span className="text-brand-700">圖片上傳中（{uploading}）…</span>
          )}
          <a
            href={MARKDOWN_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-brand-700"
          >
            Markdown 教學
          </a>
        </div>
      </div>

      {/* Preview: grows with content, same typography as the post page */}
      <section aria-label="預覽" className="w-full">
        <p className="mb-1.5 font-semibold text-ink-500 text-xs">
          預覽（與發布後的文章排版相同）
        </p>
        <div className="rounded-control border border-line bg-paper px-4 py-4">
          {content.trim() ? (
            <MarkdownView markdown={content} debounceMs={200} />
          ) : (
            <p className="text-ink-400 text-sm">預覽內容將顯示在這裡…</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MdEditorSync;

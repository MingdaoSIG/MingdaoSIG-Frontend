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
// (docs/redesign/redesign-2026.md §10–11). It fills the writing step; with
// 預覽 on, the rendered post takes its place (the source stays mounted, so
// undo history and the cursor survive).

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  /** Show the rendered post instead of the source. */
  preview: boolean;
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

const MdEditorSync = ({ data, setPostData, token, preview }: Props) => {
  const { hostRef, content, items, uploading, fileInputProps } =
    useMarkdownEditor({
      data,
      setPostData,
      token,
      fontSize: "16px",
      padding: "1rem",
    });

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-control border border-line-strong bg-surface">
      <div
        hidden={preview}
        className="scrollbar-hide flex shrink-0 items-center gap-0.5 overflow-x-auto border-line border-b px-1.5 py-1"
      >
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
      <div
        ref={hostRef}
        className={`min-h-[16rem] flex-1 overflow-hidden ${preview ? "hidden" : ""}`}
      />
      {preview && (
        <section
          aria-label="預覽"
          className="scrollbar-hide min-h-[16rem] flex-1 overflow-y-auto bg-paper px-4 py-4"
        >
          {content.trim() ? (
            <MarkdownView markdown={content} debounceMs={200} />
          ) : (
            <p className="text-ink-400 text-sm">還沒有內容</p>
          )}
        </section>
      )}
      <div className="flex shrink-0 items-center gap-3 border-line border-t px-3 py-1.5 text-ink-500 text-xs">
        <span className="tabular-nums">字數 {countWords(content)}</span>
        {uploading > 0 && (
          <span className="text-brand-700">圖片上傳中（{uploading}）…</span>
        )}
        {preview && <span>與發布後的文章排版相同</span>}
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
  );
};

export default MdEditorSync;

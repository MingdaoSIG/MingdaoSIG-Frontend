"use client";

import { Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import { countWords } from "../shared/markdownCommands";
import {
  MARKDOWN_GUIDE_URL,
  useMarkdownEditor,
} from "../shared/useMarkdownEditor";
import type { TPostAPI } from "../types/postAPI";

// Desktop Markdown editor: CodeMirror 6 source on the left, the same
// renderer as the post page on the right (docs/redesign/redesign-2026.md §10).

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const TOOLBAR = [
  ["bold", "italic", "underline", "strike"],
  ["h2", "h3", "quote", "bullet", "ordered", "task"],
  ["code", "codeBlock", "link", "image", "table"],
  ["undo", "redo"],
];

export default function MdEditorSync({ data, setPostData, token }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const { hostRef, content, items, uploading, fileInputProps } =
    useMarkdownEditor({
      data,
      setPostData,
      token,
      // proportional scroll sync to the preview
      onScroll: (source) => {
        const preview = previewRef.current?.parentElement;
        if (!preview) {
          return;
        }
        const max = source.scrollHeight - source.clientHeight;
        const ratio = max > 0 ? source.scrollTop / max : 0;
        preview.scrollTop =
          ratio * (preview.scrollHeight - preview.clientHeight);
      },
    });

  // Esc leaves in-page fullscreen
  useEffect(() => {
    if (!fullscreen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const toolButton =
    "flex size-8 cursor-pointer items-center justify-center rounded-chip text-ink-700 transition-colors hover:bg-field hover:text-ink-900";

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden border border-line bg-surface shadow-card ${
        fullscreen ? "fixed inset-4 z-50 rounded-card" : "h-full rounded-card"
      }`}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1 border-line border-b px-3 py-1.5">
        {TOOLBAR.map((group, groupIndex) => (
          <div key={group.join()} className="flex items-center gap-0.5">
            {groupIndex > 0 && (
              <span aria-hidden className="mx-1.5 h-5 w-px bg-line" />
            )}
            {group.map((key) => {
              const item = items[key];
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  className={toolButton}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={item.onClick}
                >
                  <item.icon size={17} aria-hidden />
                </button>
              );
            })}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            title={showPreview ? "隱藏預覽" : "顯示預覽"}
            aria-label={showPreview ? "隱藏預覽" : "顯示預覽"}
            aria-pressed={showPreview}
            className={toolButton}
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <Eye size={17} aria-hidden />
            ) : (
              <EyeOff size={17} aria-hidden />
            )}
          </button>
          <button
            type="button"
            title={fullscreen ? "離開全螢幕 (Esc)" : "全螢幕"}
            aria-label={fullscreen ? "離開全螢幕" : "全螢幕"}
            aria-pressed={fullscreen}
            className={toolButton}
            onClick={() => setFullscreen((v) => !v)}
          >
            {fullscreen ? (
              <Minimize2 size={17} aria-hidden />
            ) : (
              <Maximize2 size={17} aria-hidden />
            )}
          </button>
        </div>
        <input {...fileInputProps} />
      </div>

      {/* Source | Preview */}
      <div
        className={`grid min-h-0 flex-1 ${
          showPreview ? "grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div ref={hostRef} className="min-h-0 overflow-hidden" />
        {showPreview && (
          <div className="custom-scrollbar min-h-0 overflow-y-auto border-line border-l bg-paper px-8 py-6">
            <MarkdownView
              ref={previewRef}
              markdown={content}
              debounceMs={150}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-4 border-line border-t px-4 py-1.5 text-ink-500 text-xs">
        <span className="tabular-nums">字數 {countWords(content)}</span>
        {uploading > 0 && (
          <span className="text-brand-700">圖片上傳中（{uploading}）…</span>
        )}
        <span className="ml-auto">右側預覽與發布後的文章排版相同</span>
        <a
          href={MARKDOWN_GUIDE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-brand-700 hover:underline"
        >
          Markdown 教學
        </a>
      </div>
    </div>
  );
}

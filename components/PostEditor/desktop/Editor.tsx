"use client";

import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  redo,
  undo,
} from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import {
  Bold,
  Code,
  Eye,
  EyeOff,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Swal from "sweetalert2";
import { MarkdownView } from "@/components/Markdown/MarkdownView";
import type { IImageUpload } from "@/interfaces/Image.interface";
import { imageUpload } from "@/modules/imageUploadAPI";
import type { TPostAPI } from "../types/postAPI";
import {
  countWords,
  insertCodeBlock,
  insertLink,
  insertTable,
  toggleLinePrefix,
  wrap,
} from "./markdownCommands";

// Desktop Markdown editor: CodeMirror 6 source on the left, the same
// renderer as the post page on the right (docs/redesign/desktop-v3.md §7).

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MARKDOWN_GUIDE_URL =
  "https://sig.mingdao.edu.tw/post/652e4591d04b679afdff697e";
const VALID_IMAGE_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/tiff",
];
const MAX_IMAGE_BYTES = 5 * 1000 * 1000;

const highlight = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "1.3em",
    fontWeight: "700",
    color: "#111d29",
  },
  {
    tag: tags.heading2,
    fontSize: "1.18em",
    fontWeight: "700",
    color: "#111d29",
  },
  {
    tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6],
    fontWeight: "700",
    color: "#111d29",
  },
  { tag: tags.strong, fontWeight: "700", color: "#111d29" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: [tags.link, tags.url], color: "#0b5a83" },
  { tag: tags.quote, color: "#586676" },
  {
    tag: tags.monospace,
    color: "#b42318",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  {
    tag: [tags.processingInstruction, tags.meta, tags.contentSeparator],
    color: "#7a8694",
  },
  { tag: tags.list, color: "#0b5a83" },
]);

const editorTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "15px", backgroundColor: "#ffffff" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: '"Noto Sans TC", system-ui, sans-serif',
    lineHeight: "1.8",
    padding: "1.25rem 0",
  },
  ".cm-content": { padding: "0 1.5rem", caretColor: "#0b5a83" },
  ".cm-line": { padding: "0" },
  ".cm-placeholder": { color: "#7a8694" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
    { backgroundColor: "rgba(11, 90, 131, 0.16) !important" },
  ".cm-cursor": { borderLeftColor: "#0b5a83", borderLeftWidth: "2px" },
});

function validateImage(file: File) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    Swal.fire("不支援的檔案格式", "只能上傳 JPG、PNG、WebP、TIFF", "error");
    return false;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    Swal.fire("檔案太大", "圖片需小於 5MB", "error");
    return false;
  }
  return true;
}

export default function MdEditorSync({ data, setPostData, token }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef(token);
  const [showPreview, setShowPreview] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading] = useState(0);

  tokenRef.current = token;
  const content = data?.content ?? "";

  // --- image upload (toolbar, paste, drop) ----------------------------
  const uploadImages = useCallback(async (files: File[], at?: number) => {
    const view = viewRef.current;
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (!view || images.length === 0) {
      return;
    }
    const valid = images.filter(validateImage);
    if (valid.length === 0) {
      return;
    }
    setUploading((n) => n + valid.length);
    const urls: string[] = [];
    for (const file of valid) {
      try {
        const res = await imageUpload(file, tokenRef.current);
        const json = (await res.json()) as IImageUpload;
        if (!json?.id) {
          throw new Error("Upload returned no id");
        }
        urls.push(`${API_URL}/image/${json.id}`);
      } catch (error) {
        console.error("Image upload failed:", error);
        Swal.fire("上傳失敗", "圖片上傳失敗，請稍後再試", "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (urls.length === 0) {
      return;
    }
    const pos = at ?? view.state.selection.main.head;
    const line = view.state.doc.lineAt(pos);
    const lead = line.text.trim() === "" ? "" : "\n";
    const insert = `${lead}${urls.map((url) => `![](${url})`).join("\n")}\n`;
    view.dispatch({
      changes: { from: pos, insert },
      selection: { anchor: pos + insert.length },
      scrollIntoView: true,
    });
    view.focus();
  }, []);

  // --- mount CodeMirror once (content is synced by the effect below) ----
  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: content,
        extensions: [
          history(),
          markdown({ base: markdownLanguage }),
          syntaxHighlighting(highlight),
          EditorView.lineWrapping,
          placeholder("開始寫作…支援 Markdown 語法"),
          editorTheme,
          keymap.of([
            { key: "Mod-b", run: (v) => wrap(v, "**") },
            { key: "Mod-i", run: (v) => wrap(v, "*") },
            { key: "Mod-u", run: (v) => wrap(v, "<u>", "</u>") },
            { key: "Mod-k", run: insertLink },
            indentWithTab,
            ...historyKeymap,
            ...defaultKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const next = update.state.doc.toString();
              setPostData((prev) => ({ ...prev, content: next }) as TPostAPI);
            }
          }),
          EditorView.domEventHandlers({
            paste: (event) => {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (files.some((file) => file.type.startsWith("image/"))) {
                event.preventDefault();
                uploadImages(files);
                return true;
              }
              return false;
            },
            drop: (event, v) => {
              const files = Array.from(event.dataTransfer?.files ?? []);
              if (!files.some((file) => file.type.startsWith("image/"))) {
                return false;
              }
              event.preventDefault();
              const pos =
                v.posAtCoords({ x: event.clientX, y: event.clientY }) ??
                undefined;
              uploadImages(files, pos);
              return true;
            },
            scroll: (_event, v) => {
              // proportional scroll sync to the preview
              const preview = previewRef.current?.parentElement;
              const source = v.scrollDOM;
              if (!preview) {
                return;
              }
              const max = source.scrollHeight - source.clientHeight;
              const ratio = max > 0 ? source.scrollTop / max : 0;
              preview.scrollTop =
                ratio * (preview.scrollHeight - preview.clientHeight);
            },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // --- adopt external content (draft restore, post loaded for edit) ----
  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  // --- Esc leaves in-page fullscreen ------------------------------------
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

  const run = (command: (view: EditorView) => boolean) => () => {
    if (viewRef.current) {
      command(viewRef.current);
    }
  };

  const groups: {
    key: string;
    items: {
      label: string;
      icon: typeof Bold;
      onClick: () => void;
    }[];
  }[] = [
    {
      key: "inline",
      items: [
        {
          label: "粗體 (Ctrl/⌘+B)",
          icon: Bold,
          onClick: run((v) => wrap(v, "**")),
        },
        {
          label: "斜體 (Ctrl/⌘+I)",
          icon: Italic,
          onClick: run((v) => wrap(v, "*")),
        },
        {
          label: "底線 (Ctrl/⌘+U)",
          icon: Underline,
          onClick: run((v) => wrap(v, "<u>", "</u>")),
        },
        {
          label: "刪除線",
          icon: Strikethrough,
          onClick: run((v) => wrap(v, "~~")),
        },
      ],
    },
    {
      key: "block",
      items: [
        {
          label: "大標題",
          icon: Heading2,
          onClick: run((v) => toggleLinePrefix(v, "## ", { heading: true })),
        },
        {
          label: "小標題",
          icon: Heading3,
          onClick: run((v) => toggleLinePrefix(v, "### ", { heading: true })),
        },
        {
          label: "引用",
          icon: Quote,
          onClick: run((v) => toggleLinePrefix(v, "> ")),
        },
        {
          label: "項目清單",
          icon: List,
          onClick: run((v) => toggleLinePrefix(v, "- ")),
        },
        {
          label: "編號清單",
          icon: ListOrdered,
          onClick: run((v) => toggleLinePrefix(v, "1. ", { numbered: true })),
        },
        {
          label: "待辦清單",
          icon: ListChecks,
          onClick: run((v) => toggleLinePrefix(v, "- [ ] ")),
        },
      ],
    },
    {
      key: "insert",
      items: [
        { label: "行內程式碼", icon: Code, onClick: run((v) => wrap(v, "`")) },
        {
          label: "程式碼區塊",
          icon: SquareCode,
          onClick: run(insertCodeBlock),
        },
        { label: "連結 (Ctrl/⌘+K)", icon: Link, onClick: run(insertLink) },
        {
          label: "上傳圖片（也可直接貼上或拖曳）",
          icon: ImageIcon,
          onClick: () => fileInputRef.current?.click(),
        },
        { label: "表格", icon: Table, onClick: run(insertTable) },
      ],
    },
    {
      key: "history",
      items: [
        { label: "復原 (Ctrl/⌘+Z)", icon: Undo2, onClick: run(undo) },
        { label: "重做 (Ctrl/⌘+Shift+Z)", icon: Redo2, onClick: run(redo) },
      ],
    },
  ];

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
        {groups.map((group, groupIndex) => (
          <div key={group.key} className="flex items-center gap-0.5">
            {groupIndex > 0 && (
              <span aria-hidden className="mx-1.5 h-5 w-px bg-line" />
            )}
            {group.items.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.label}
                aria-label={item.label}
                className={toolButton}
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.onClick}
              >
                <item.icon size={17} aria-hidden />
              </button>
            ))}
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
        <input
          ref={fileInputRef}
          type="file"
          accept={VALID_IMAGE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            uploadImages(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
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

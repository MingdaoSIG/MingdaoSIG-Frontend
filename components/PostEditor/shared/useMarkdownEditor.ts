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
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
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
import type { IImageUpload } from "@/interfaces/Image.interface";
import { imageUpload } from "@/modules/imageUploadAPI";
import type { TPostAPI } from "../types/postAPI";
import {
  insertCodeBlock,
  insertLink,
  insertTable,
  toggleLinePrefix,
  wrap,
} from "./markdownCommands";

// Shared CodeMirror 6 core for the desktop and mobile post editors
// (docs/redesign/redesign-2026.md §10). Each platform supplies its own
// toolbar layout and container; behaviour lives here.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const MARKDOWN_GUIDE_URL =
  "https://sig.mingdao.edu.tw/post/652e4591d04b679afdff697e";
export const VALID_IMAGE_TYPES = [
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

function editorTheme(fontSize: string, padding: string) {
  return EditorView.theme({
    "&": { height: "100%", fontSize, backgroundColor: "#ffffff" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": {
      fontFamily: '"Noto Sans TC", system-ui, sans-serif',
      lineHeight: "1.8",
      padding: "1rem 0",
    },
    ".cm-content": { padding: `0 ${padding}`, caretColor: "#0b5a83" },
    ".cm-line": { padding: "0" },
    ".cm-placeholder": { color: "#7a8694" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection":
      { backgroundColor: "rgba(11, 90, 131, 0.16) !important" },
    ".cm-cursor": { borderLeftColor: "#0b5a83", borderLeftWidth: "2px" },
  });
}

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

export type ToolbarItem = {
  key: string;
  label: string;
  icon: typeof Bold;
  onClick: () => void;
};

export function useMarkdownEditor({
  data,
  setPostData,
  token,
  fontSize = "15px",
  padding = "1.5rem",
  onScroll,
}: {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  token: string;
  /** 16px on mobile: smaller text makes iOS Safari zoom on focus */
  fontSize?: string;
  padding?: string;
  onScroll?: (scroller: HTMLElement) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef(token);
  const onScrollRef = useRef(onScroll);
  const [uploading, setUploading] = useState(0);

  tokenRef.current = token;
  onScrollRef.current = onScroll;
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
          editorTheme(fontSize, padding),
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
              onScrollRef.current?.(v.scrollDOM);
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

  const run = (command: (view: EditorView) => boolean) => () => {
    if (viewRef.current) {
      command(viewRef.current);
    }
  };

  const openImagePicker = () => fileInputRef.current?.click();

  const items: Record<string, ToolbarItem> = {
    bold: {
      key: "bold",
      label: "粗體 (Ctrl/⌘+B)",
      icon: Bold,
      onClick: run((v) => wrap(v, "**")),
    },
    italic: {
      key: "italic",
      label: "斜體 (Ctrl/⌘+I)",
      icon: Italic,
      onClick: run((v) => wrap(v, "*")),
    },
    underline: {
      key: "underline",
      label: "底線 (Ctrl/⌘+U)",
      icon: Underline,
      onClick: run((v) => wrap(v, "<u>", "</u>")),
    },
    strike: {
      key: "strike",
      label: "刪除線",
      icon: Strikethrough,
      onClick: run((v) => wrap(v, "~~")),
    },
    h2: {
      key: "h2",
      label: "大標題",
      icon: Heading2,
      onClick: run((v) => toggleLinePrefix(v, "## ", { heading: true })),
    },
    h3: {
      key: "h3",
      label: "小標題",
      icon: Heading3,
      onClick: run((v) => toggleLinePrefix(v, "### ", { heading: true })),
    },
    quote: {
      key: "quote",
      label: "引用",
      icon: Quote,
      onClick: run((v) => toggleLinePrefix(v, "> ")),
    },
    bullet: {
      key: "bullet",
      label: "項目清單",
      icon: List,
      onClick: run((v) => toggleLinePrefix(v, "- ")),
    },
    ordered: {
      key: "ordered",
      label: "編號清單",
      icon: ListOrdered,
      onClick: run((v) => toggleLinePrefix(v, "1. ", { numbered: true })),
    },
    task: {
      key: "task",
      label: "待辦清單",
      icon: ListChecks,
      onClick: run((v) => toggleLinePrefix(v, "- [ ] ")),
    },
    code: {
      key: "code",
      label: "行內程式碼",
      icon: Code,
      onClick: run((v) => wrap(v, "`")),
    },
    codeBlock: {
      key: "codeBlock",
      label: "程式碼區塊",
      icon: SquareCode,
      onClick: run(insertCodeBlock),
    },
    link: {
      key: "link",
      label: "連結 (Ctrl/⌘+K)",
      icon: Link,
      onClick: run(insertLink),
    },
    image: {
      key: "image",
      label: "上傳圖片（也可直接貼上或拖曳）",
      icon: ImageIcon,
      onClick: openImagePicker,
    },
    table: {
      key: "table",
      label: "表格",
      icon: Table,
      onClick: run(insertTable),
    },
    undo: {
      key: "undo",
      label: "復原 (Ctrl/⌘+Z)",
      icon: Undo2,
      onClick: run(undo),
    },
    redo: {
      key: "redo",
      label: "重做 (Ctrl/⌘+Shift+Z)",
      icon: Redo2,
      onClick: run(redo),
    },
  };

  const fileInputProps = {
    ref: fileInputRef,
    type: "file" as const,
    accept: VALID_IMAGE_TYPES.join(","),
    multiple: true,
    hidden: true,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      uploadImages(Array.from(e.target.files ?? []));
      e.target.value = "";
    },
  };

  return { hostRef, content, items, uploading, fileInputProps };
}

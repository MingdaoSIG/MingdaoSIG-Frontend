"use client";

import {
  Component,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { TPostAPI } from "../types/postAPI";

// If the rich editor (CodeMirror) throws, keep the page alive and fall back
// to a plain textarea bound to the same post state, so the author keeps
// their draft and can still publish.

interface Props {
  data: TPostAPI;
  setPostData: Dispatch<SetStateAction<TPostAPI>>;
  minHeight?: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Post editor crashed, using plain text mode:", error);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    const { data, setPostData, minHeight = "20rem" } = this.props;
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <p className="shrink-0 border-line border-b bg-brand-50 px-4 py-2 text-brand-800 text-sm">
          編輯器發生問題，已切換成純文字模式。內容都還在，可以繼續編輯並發布。
        </p>
        <textarea
          aria-label="文章內容（Markdown）"
          className="min-h-0 w-full flex-1 resize-none bg-surface px-4 py-3 font-mono text-base text-ink-900 leading-7 focus:outline-none"
          style={{ minHeight }}
          value={data?.content ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            setPostData((prev) => ({ ...prev, content: next }) as TPostAPI);
          }}
        />
      </div>
    );
  }
}

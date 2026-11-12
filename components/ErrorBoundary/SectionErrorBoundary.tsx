"use client";

import { Component, type ReactNode } from "react";

// Wraps one block of a page (post body, comments, post list) so a render
// error there shows a small notice instead of taking the whole page down.

interface Props {
  children: ReactNode;
  /** What failed, shown to the user, e.g. "留言". */
  label: string;
  /** Rendered instead of the default notice. */
  fallback?: ReactNode;
  className?: string;
}

interface State {
  failed: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`${this.props.label} failed to render:`, error);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }
    return (
      <div
        role="alert"
        className={`flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-center text-ink-700 text-sm ${
          this.props.className ?? ""
        }`}
      >
        <p>{this.props.label}暫時無法顯示</p>
        <button
          type="button"
          className="cursor-pointer rounded-control border border-line px-3 py-1.5 text-ink-800 hover:bg-field"
          onClick={() => this.setState({ failed: false })}
        >
          重試
        </button>
      </div>
    );
  }
}

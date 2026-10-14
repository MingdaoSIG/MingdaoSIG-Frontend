"use client";

import { BookOpen, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

// Reader mode for the desktop post page (docs/redesign/desktop-v3.md §6).
// State is reflected onto <html data-reader*> so pure CSS can hide the
// surrounding chrome. Text size and tone are remembered; entering reader
// mode itself is always an explicit choice.

type Size = "s" | "m" | "l";
type Tone = "paper" | "sepia";

const SIZES: Size[] = ["s", "m", "l"];
const STORAGE_KEY = "mdsig-reader-prefs";

function clearRootState() {
  const root = document.documentElement;
  delete root.dataset.reader;
  delete root.dataset.readerSize;
  delete root.dataset.readerTone;
}

export default function ReaderMode({ title }: { title: string }) {
  const [active, setActive] = useState(false);
  const [size, setSize] = useState<Size>("m");
  const [tone, setTone] = useState<Tone>("paper");
  const [progress, setProgress] = useState(0);

  // Restore remembered preferences
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (SIZES.includes(prefs.size)) {
        setSize(prefs.size);
      }
      if (prefs.tone === "paper" || prefs.tone === "sepia") {
        setTone(prefs.tone);
      }
    } catch {
      // Malformed preferences: fall back to defaults
    }
  }, []);

  // Reflect state onto <html>
  useEffect(() => {
    if (!active) {
      clearRootState();
      return;
    }
    const root = document.documentElement;
    root.dataset.reader = "on";
    root.dataset.readerSize = size;
    root.dataset.readerTone = tone;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ size, tone }));
  }, [active, size, tone]);

  // Never leak reader state to other pages
  useEffect(() => clearRootState, []);

  // Esc to leave
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Reading progress
  useEffect(() => {
    if (!active) {
      return;
    }
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  const enter = () => {
    setActive(true);
    window.scrollTo({ top: 0 });
  };

  const sizeIndex = SIZES.indexOf(size);

  return (
    <>
      <button
        type="button"
        className="reader-toggle"
        onClick={enter}
        aria-pressed={active}
      >
        <BookOpen size={16} aria-hidden />
        閱讀模式
      </button>

      <div className="reader-bar" aria-hidden={!active}>
        <button
          type="button"
          className="reader-exit"
          onClick={() => setActive(false)}
        >
          <X size={16} aria-hidden />
          離開閱讀模式
          <kbd>Esc</kbd>
        </button>

        <p className="reader-title">{title}</p>

        <div className="reader-controls">
          <fieldset className="reader-group" aria-label="字級">
            <button
              type="button"
              aria-label="縮小字級"
              disabled={sizeIndex === 0}
              onClick={() => setSize(SIZES[sizeIndex - 1])}
            >
              <Minus size={14} aria-hidden />
            </button>
            <span className="reader-size-label">
              {size === "s" ? "小" : size === "m" ? "中" : "大"}
            </span>
            <button
              type="button"
              aria-label="放大字級"
              disabled={sizeIndex === SIZES.length - 1}
              onClick={() => setSize(SIZES[sizeIndex + 1])}
            >
              <Plus size={14} aria-hidden />
            </button>
          </fieldset>

          <fieldset className="reader-group" aria-label="底色">
            <button
              type="button"
              aria-pressed={tone === "paper"}
              onClick={() => setTone("paper")}
            >
              白
            </button>
            <button
              type="button"
              aria-pressed={tone === "sepia"}
              onClick={() => setTone("sepia")}
            >
              米
            </button>
          </fieldset>
        </div>

        <div
          className="reader-progress"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
    </>
  );
}

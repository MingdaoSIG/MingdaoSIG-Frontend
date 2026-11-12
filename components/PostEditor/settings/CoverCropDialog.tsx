"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/Modal";
import { type CoverCrop, cropRect } from "./coverCrop";

// 調整位置 (v4 8B): drag the picture inside a 16:9 frame (or use the arrow
// keys) and zoom in, then 套用. The caller crops and uploads.

const MAX_ZOOM = 3;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function CoverCropDialog({
  open,
  imageUrl,
  naturalWidth,
  naturalHeight,
  initial,
  busy,
  onCancel,
  onApply,
}: {
  open: boolean;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  initial: CoverCrop;
  busy: boolean;
  onCancel: () => void;
  onApply: (crop: CoverCrop) => void;
}) {
  const [crop, setCrop] = useState(initial);
  const [frameWidth, setFrameWidth] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; crop: CoverCrop } | null>(null);

  useEffect(() => {
    if (open) {
      setCrop(initial);
    }
  }, [open, initial]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!open || !frame) {
      return;
    }
    const measure = () => setFrameWidth(frame.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open]);

  const rect = cropRect(naturalWidth, naturalHeight, crop);
  const scale = frameWidth > 0 ? frameWidth / rect.sw : 0;
  const spareX = naturalWidth - rect.sw;
  const spareY = naturalHeight - rect.sh;

  /** Moves the crop by a distance in frame pixels. */
  function moveBy(from: CoverCrop, dx: number, dy: number) {
    if (!scale) {
      return from;
    }
    const { sx, sy } = cropRect(naturalWidth, naturalHeight, from);
    return {
      ...from,
      x: spareX > 0 ? clamp((sx - dx / scale) / spareX, 0, 1) : 0.5,
      y: spareY > 0 ? clamp((sy - dy / scale) / spareY, 0, 1) : 0.5,
    };
  }

  const zoomTo = (zoom: number) =>
    setCrop((value) => ({ ...value, zoom: clamp(zoom, 1, MAX_ZOOM) }));

  const button =
    "inline-flex h-9 cursor-pointer items-center justify-center rounded-control px-4 font-semibold text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="調整封面位置"
      busy={busy}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={`${button} border border-line-strong bg-surface text-ink-800 hover:bg-field`}
            onClick={onCancel}
            disabled={busy}
          >
            取消
          </button>
          <button
            type="button"
            className={`${button} bg-brand-700 text-white hover:bg-brand-800`}
            onClick={() => onApply(crop)}
            disabled={busy}
          >
            {busy ? "上傳中…" : "套用"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-ink-500 text-sm">
          拖曳圖片選擇要顯示的 16:9 範圍，也可以用方向鍵移動。
        </p>
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="封面位置"
          aria-valuetext={`水平 ${Math.round(crop.x * 100)}%，垂直 ${Math.round(crop.y * 100)}%`}
          aria-valuenow={Math.round(crop.x * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative aspect-video w-full cursor-grab touch-none select-none overflow-hidden rounded-control bg-field outline-offset-2 focus-visible:outline-2 focus-visible:outline-brand-700 active:cursor-grabbing"
          data-cover-crop-frame
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, crop };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start) {
              return;
            }
            setCrop(
              moveBy(
                start.crop,
                event.clientX - start.x,
                event.clientY - start.y,
              ),
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 40 : 10;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [step, 0],
              ArrowRight: [-step, 0],
              ArrowUp: [0, step],
              ArrowDown: [0, -step],
            };
            const move = moves[event.key];
            if (move) {
              event.preventDefault();
              setCrop((value) => moveBy(value, move[0], move[1]));
            }
          }}
        >
          {scale > 0 && (
            // biome-ignore lint/performance/noImgElement: a local object URL, positioned by hand
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: naturalWidth * scale,
                height: naturalHeight * scale,
                left: -rect.sx * scale,
                top: -rect.sy * scale,
              }}
            />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-control ring-1 ring-white/70 ring-inset"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="縮小"
            className="flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-700 hover:bg-field disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => zoomTo(crop.zoom - 0.25)}
            disabled={crop.zoom <= 1}
          >
            <Minus aria-hidden className="size-4" />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.05}
            value={crop.zoom}
            onChange={(event) => zoomTo(Number(event.target.value))}
            aria-label="縮放"
            className="flex-1 accent-brand-700"
          />
          <button
            type="button"
            aria-label="放大"
            className="flex size-9 cursor-pointer items-center justify-center rounded-control text-ink-700 hover:bg-field disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => zoomTo(crop.zoom + 0.25)}
            disabled={crop.zoom >= MAX_ZOOM}
          >
            <Plus aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

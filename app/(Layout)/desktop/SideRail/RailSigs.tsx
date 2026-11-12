"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { imageUrl } from "@/modules/imageUrl";
import { hasNewPosts, type SigSeenMap } from "@/modules/sigSeen";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { type MySig, useSaveSigOrder } from "@/utils/useMySigs";

// The user's SIGs in the side rail, Discord-style (owner 2026-11-13):
// each SIG's avatar in a rounded square (its coloured initial when there
// is none or it fails to load), a pill in the SIG colour on the left edge
// for the current SIG and on hover, a dot for new posts, and the order
// is the user's own: drag with the mouse, or Space / ↑ ↓ / Space (Esc
// cancels) from the keyboard. The order is saved by useSaveSigOrder.

const DRAG_THRESHOLD = 4;
/** Auto-scroll while dragging within this many px of the list's edge. */
const EDGE = 40;
/** The fastest auto-scroll, in px per frame (right at the edge). */
const MAX_SPEED = 12;

function firstLetter(name: string) {
  const [first = "?"] = Array.from(name.trim());
  return first.toUpperCase();
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SigAvatar({ sig }: { sig: MySig }) {
  const src = imageUrl(sig.avatar);
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span
        aria-hidden
        data-rail-initial
        className="sig-text flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--sig-color)_18%,white)] font-bold text-[15px]"
      >
        {firstLetter(sig.name)}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={40}
      height={40}
      draggable={false}
      data-rail-avatar
      onError={() => setBroken(true)}
      className="size-full object-cover"
    />
  );
}

type Drag = {
  id: string;
  pointerId: number;
  startY: number;
  /** Past the threshold: a real drag, not a click. */
  moving: boolean;
  /** Where the item would land, as an index in the list without it. */
  target: number;
};

export function RailSigs({
  sigs,
  seen,
  currentPath,
  onShow,
  onHide,
}: {
  sigs: MySig[];
  seen: SigSeenMap;
  /** The decoded path, to mark the current SIG. */
  currentPath: string;
  onShow: (label: string) => (event: MouseEvent | FocusEvent) => void;
  onHide: () => void;
}) {
  const saveOrder = useSaveSigOrder();
  const listRef = useRef<HTMLUListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const suppressClick = useRef(false);
  // Keyboard: the item picked up, and the order before it moved.
  const [grabbed, setGrabbed] = useState<{
    id: string;
    before: string[];
  } | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const helpId = useId();

  const ids = sigs.map((sig) => sig._id);
  const order = preview ?? ids;
  const byId = new Map(sigs.map((sig) => [sig._id, sig]));
  const shown = order
    .map((id) => byId.get(id))
    .filter((sig): sig is MySig => Boolean(sig));

  // A new membership or follow while a preview is up: drop the preview.
  const idsKey = ids.join(",");
  useEffect(() => {
    setPreview(null);
    setGrabbed(null);
  }, [idsKey]);

  function nameOf(id: string) {
    return byId.get(id)?.name ?? "";
  }

  /** The drop position for a pointer at `clientY`, without the dragged one. */
  function targetAt(clientY: number, draggedId: string) {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>("[data-rail-item-id]") ??
        [],
    ).filter((item) => item.dataset.railItemId !== draggedId);
    let index = 0;
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY > rect.top + rect.height / 2) {
        index += 1;
      }
    }
    return index;
  }

  function onPointerDown(event: PointerEvent<HTMLLIElement>, id: string) {
    if (event.button !== 0 || grabbed) {
      return;
    }
    setDrag({
      id,
      pointerId: event.pointerId,
      startY: event.clientY,
      moving: false,
      target: ids.indexOf(id),
    });
  }

  // Auto-scroll: while a drag is near the top or bottom of a list taller
  // than the window, scroll it a little every frame and re-aim the drop.
  const pointerY = useRef(0);
  const scrollFrame = useRef<number | null>(null);

  function stopAutoScroll() {
    if (scrollFrame.current !== null) {
      cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = null;
    }
  }

  function autoScroll(draggedId: string) {
    const box = listRef.current?.closest<HTMLElement>("[data-rail-sigs]");
    if (!box || box.scrollHeight <= box.clientHeight) {
      return;
    }
    const step = () => {
      const rect = box.getBoundingClientRect();
      const y = pointerY.current;
      let speed = 0;
      if (y < rect.top + EDGE) {
        speed = -Math.ceil(((rect.top + EDGE - y) / EDGE) * MAX_SPEED);
      } else if (y > rect.bottom - EDGE) {
        speed = Math.ceil(((y - (rect.bottom - EDGE)) / EDGE) * MAX_SPEED);
      }
      speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, speed));
      if (speed === 0) {
        scrollFrame.current = null;
        return;
      }
      const before = box.scrollTop;
      box.scrollTop = before + speed;
      if (box.scrollTop !== before) {
        setDrag((current) =>
          current?.moving
            ? { ...current, target: targetAt(y, draggedId) }
            : current,
        );
      }
      scrollFrame.current = requestAnimationFrame(step);
    };
    if (scrollFrame.current === null) {
      scrollFrame.current = requestAnimationFrame(step);
    }
  }

  useEffect(() => stopAutoScroll, []);

  function onPointerMove(event: PointerEvent<HTMLLIElement>) {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    pointerY.current = event.clientY;
    if (!drag.moving) {
      if (Math.abs(event.clientY - drag.startY) < DRAG_THRESHOLD) {
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      onHide();
    }
    setDrag({
      ...drag,
      moving: true,
      target: targetAt(event.clientY, drag.id),
    });
    autoScroll(drag.id);
  }

  function finishDrag(event: PointerEvent<HTMLLIElement>, drop: boolean) {
    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }
    stopAutoScroll();
    if (drag.moving) {
      // The click that follows the release must not open the SIG.
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      const from = ids.indexOf(drag.id);
      if (drop && from >= 0 && drag.target !== from) {
        const next = move(ids, from, drag.target);
        saveOrder(next);
        setAnnouncement(`已把 ${nameOf(drag.id)} 移到第 ${drag.target + 1} 個`);
      }
    }
    setDrag(null);
  }

  // Escape cancels a mouse drag.
  useEffect(() => {
    if (!drag?.moving) {
      return;
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        suppressClick.current = true;
        stopAutoScroll();
        setDrag(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drag?.moving]);

  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>, id: string) {
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      if (!grabbed) {
        setGrabbed({ id, before: ids });
        setPreview(ids);
        setAnnouncement(
          `已拿起 ${nameOf(id)}，第 ${ids.indexOf(id) + 1} 個，共 ${ids.length} 個。用上下鍵移動，空白鍵放下，Esc 取消。`,
        );
        return;
      }
      const next = preview ?? ids;
      saveOrder(next);
      setAnnouncement(`已放下 ${nameOf(id)}，第 ${next.indexOf(id) + 1} 個`);
      setGrabbed(null);
      setPreview(null);
      return;
    }
    if (!grabbed) {
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const current = preview ?? ids;
      const from = current.indexOf(id);
      const to =
        event.key === "ArrowUp"
          ? Math.max(0, from - 1)
          : Math.min(current.length - 1, from + 1);
      if (to !== from) {
        setPreview(move(current, from, to));
        setAnnouncement(`第 ${to + 1} 個`);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setGrabbed(null);
      setPreview(null);
      setAnnouncement(
        `已取消，${nameOf(id)} 留在第 ${grabbed.before.indexOf(id) + 1} 個`,
      );
      return;
    }
    if (event.key === "Tab") {
      setGrabbed(null);
      setPreview(null);
    }
  }

  // Keep focus on the item that moved (React moves its node).
  const focusId = grabbed?.id;
  useEffect(() => {
    if (!focusId) {
      return;
    }
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-rail-sig="${focusId}"]`,
    );
    item?.focus({ preventScroll: true });
    // A long list: keep the moved SIG in view.
    item?.scrollIntoView({ block: "nearest" });
  }, [focusId, preview]);

  const dragging = drag?.moving ? drag : null;
  // The drop line: before the item at `target` in the list without the
  // dragged one.
  const withoutDragged = dragging ? ids.filter((id) => id !== dragging.id) : [];
  const lineBefore = dragging
    ? (withoutDragged[dragging.target] ?? "end")
    : null;

  return (
    <>
      <p id={helpId} className="sr-only">
        按空白鍵可以拿起來排序
      </p>
      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
      <ul
        ref={listRef}
        aria-label="我的 SIG"
        data-dragging={dragging ? "" : undefined}
        className="flex w-full flex-col gap-2.5"
      >
        {shown.map((sig) => {
          const active = currentPath === `/@${sig.customId}`;
          const isNew = hasNewPosts(seen, sig);
          const label = isNew ? `${sig.name}（有新貼文）` : sig.name;
          const isDragged = dragging?.id === sig._id;
          const isGrabbed = grabbed?.id === sig._id;
          return (
            <li
              key={sig._id}
              data-rail-item-id={sig._id}
              onPointerDown={(event) => onPointerDown(event, sig._id)}
              onPointerMove={onPointerMove}
              onPointerUp={(event) => finishDrag(event, true)}
              onPointerCancel={(event) => finishDrag(event, false)}
              className={`group relative flex w-full justify-center ${
                dragging ? "cursor-grabbing" : ""
              }`}
              style={{
                ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR,
              }}
            >
              {lineBefore === sig._id && (
                <span
                  aria-hidden
                  data-drop-line
                  className="absolute -top-[7px] right-2 left-2 h-[3px] rounded-full bg-brand-700"
                />
              )}
              {/* Discord's pill: hover → short, current SIG → tall. */}
              <span
                aria-hidden
                className={`absolute top-1/2 left-0 w-1 -translate-y-1/2 rounded-r-full bg-[var(--sig-color)] transition-all duration-150 ${
                  active ? "h-8" : "h-0 group-hover:h-4"
                }`}
              />
              <Link
                href={`/@${sig.customId}`}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                aria-describedby={helpId}
                aria-pressed={isGrabbed || undefined}
                data-rail-sig={sig._id}
                data-new={isNew || undefined}
                draggable={false}
                onDragStart={(event) => event.preventDefault()}
                onClick={(event) => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    event.preventDefault();
                  }
                }}
                onKeyDown={(event) => onKeyDown(event, sig._id)}
                onMouseEnter={dragging ? undefined : onShow(sig.name)}
                onMouseLeave={onHide}
                onFocus={onShow(sig.name)}
                onBlur={() => {
                  onHide();
                  if (grabbed?.id === sig._id) {
                    setGrabbed(null);
                    setPreview(null);
                  }
                }}
                className={`relative flex size-10 shrink-0 touch-none select-none items-center justify-center rounded-[12px] transition-[transform,opacity,border-radius] hover:rounded-[14px] ${
                  isDragged ? "opacity-40" : ""
                } ${
                  isGrabbed
                    ? "scale-110 shadow-[0_0_0_2px_var(--color-surface),0_0_0_4px_var(--color-brand-700)]"
                    : active
                      ? "shadow-[0_0_0_2px_var(--color-surface),0_0_0_3.5px_var(--sig-color)]"
                      : ""
                }`}
              >
                <span className="size-full overflow-hidden rounded-[inherit] border border-line">
                  <SigAvatar sig={sig} />
                </span>
                {isNew && (
                  <span
                    aria-hidden
                    className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger-700 ring-2 ring-surface"
                  />
                )}
              </Link>
            </li>
          );
        })}
        {lineBefore === "end" && (
          <li aria-hidden className="relative h-0">
            <span
              data-drop-line
              className="absolute -top-[7px] right-2 left-2 h-[3px] rounded-full bg-brand-700"
            />
          </li>
        )}
      </ul>
    </>
  );
}

"use client";

import {
  ChevronDown,
  LogOut,
  MessageSquareWarning,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { issueReportHref } from "@/modules/issueReports";
import { useUserAccount } from "@/utils/useUserAccount";
import { confirmLogout } from "../../confirmLogout";
import { hubGroups } from "../../nav";

// The avatar menu on desktop: the 我的 hub (decision 7B) as a dropdown,
// with the same entries as the /me page. 管理平台 is the header button
// only (one entry, owner 2026-11-13).

const itemClass =
  "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left text-ink-800 text-sm transition-colors hover:bg-field focus-visible:bg-field";

export default function UserMenu() {
  const { userData, logout } = useUserAccount();
  const [open, setOpen] = useState(false);
  // Opened from the keyboard: focus the first entry (with its ring). With
  // the mouse: focus the menu itself, so no ring shows until a key is used.
  const [fromKeyboard, setFromKeyboard] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  // The menu only renders on the client, once opened.
  const reportFrom =
    typeof window === "undefined"
      ? pathname
      : `${pathname}${window.location.search}`;
  const customId = userData?.customId ?? null;
  const avatar = imageUrl(userData?.avatar) ?? DEFAULT_AVATAR_URL;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const first =
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    if (fromKeyboard) {
      first?.focus({ preventScroll: true });
    } else {
      menuRef.current?.focus({ preventScroll: true });
    }
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, fromKeyboard]);

  function close(focusButton: boolean) {
    setOpen(false);
    if (focusButton) {
      buttonRef.current?.focus();
    }
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    let next = -1;
    if (event.key === "ArrowDown") {
      next = index < 0 ? 0 : (index + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      next = (index - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    }
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`個人專區：${userData?.name ?? ""}`}
        data-user-menu
        onClick={(event) => {
          // A click from Enter / Space has detail 0.
          setFromKeyboard(event.detail === 0);
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setFromKeyboard(true);
            setOpen(true);
          }
        }}
        className={`flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-control border border-line py-1 pr-1.5 pl-1 text-left transition-colors hover:bg-field ${
          open ? "bg-field" : "bg-surface"
        }`}
      >
        <Image
          src={avatar}
          width={32}
          height={32}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
        {/* Name and email as before the redesign; the avatar alone on
            narrow desktop windows. */}
        <span
          data-user-menu-name
          className="hidden min-w-0 max-w-[11rem] flex-col min-[1100px]:flex"
        >
          <span
            title={userData?.name}
            className="truncate font-semibold text-ink-900 text-sm leading-4"
          >
            {userData?.name}
          </span>
          <span
            title={userData?.email}
            className="truncate text-[11px] text-ink-500 leading-4"
          >
            {userData?.email}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden className="shrink-0 text-ink-500" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="個人專區"
          tabIndex={-1}
          onKeyDown={onMenuKey}
          className="custom-scrollbar absolute top-12 right-0 z-50 flex max-h-[calc(100dvh-5.5rem)] w-72 flex-col overflow-y-auto rounded-card border border-line bg-surface p-1.5 shadow-card-hover"
        >
          <Link
            role="menuitem"
            href={customId ? `/@${customId}` : "/me"}
            className="flex items-center gap-2.5 rounded-control px-2.5 py-2 transition-colors hover:bg-field focus-visible:bg-field"
          >
            <Image
              src={avatar}
              width={28}
              height={28}
              alt=""
              className="size-7 shrink-0 rounded-full object-cover"
            />
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold text-brand-700 text-sm leading-5">
                查看個人頁面
              </span>
              {customId && (
                <span className="truncate text-ink-500 text-xs leading-4">
                  @{customId}
                </span>
              )}
            </span>
          </Link>
          {hubGroups(customId).map((group) => (
            <div
              key={group.key}
              className="mt-1 flex flex-col border-line border-t pt-1"
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    role="menuitem"
                    href={item.href}
                    data-hub-item={item.key}
                    className={itemClass}
                  >
                    <Icon size={16} aria-hidden className="text-ink-500" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="mt-1 flex flex-col border-line border-t pt-1">
            <Link role="menuitem" href="/me" className={itemClass}>
              <UserRound size={16} aria-hidden className="text-ink-500" />
              個人專區
            </Link>
            <Link
              role="menuitem"
              href={issueReportHref({ from: reportFrom })}
              className={itemClass}
            >
              <MessageSquareWarning
                size={16}
                aria-hidden
                className="text-ink-500"
              />
              回報問題
            </Link>
            <button
              type="button"
              role="menuitem"
              className={`${itemClass} text-danger-700`}
              onClick={() => {
                close(false);
                confirmLogout(logout);
              }}
            >
              <LogOut size={16} aria-hidden />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

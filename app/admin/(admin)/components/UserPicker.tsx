"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useUsers } from "../api";
import { IDENTITY_LABEL } from "../format";
import type { AdminUser } from "../types";
import { Modal } from "./Modal";
import { Avatar, Badge, Button, inputClass, Spinner } from "./ui";

/**
 * Pick one person by searching /admin/users (name, account id, email or
 * student number). People in `taken` are listed but cannot be picked.
 */
export function UserPickerDialog({
  open,
  title,
  description,
  taken = [],
  takenLabel = "已選",
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  taken?: string[];
  takenLabel?: string;
  onPick: (user: AdminUser) => void;
  onClose: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setText("");
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  const results = useUsers(
    { skip: 0, limit: 8, q: query || undefined },
    open && query.length > 0,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={title}
      description={description ?? "搜尋姓名、帳號 ID、Email 或學號"}
      initialFocus={inputRef}
      footer={<Button onClick={onClose}>關閉</Button>}
    >
      <label htmlFor={inputId} className="sr-only">
        搜尋使用者
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={text}
          maxLength={100}
          autoComplete="off"
          onChange={(event) => setText(event.target.value)}
          placeholder="例如：王小明 或 11S001"
          className={`${inputClass} pl-8`}
        />
      </div>
      <div className="mt-3 min-h-[8rem]" aria-live="polite">
        {!query ? (
          <p className="py-6 text-center text-ink-500 text-sm">
            輸入關鍵字開始搜尋
          </p>
        ) : results.isPending ||
          (results.isFetching && results.isPlaceholderData) ? (
          <div className="py-6 text-center">
            <Spinner label="搜尋中" />
          </div>
        ) : results.isError ? (
          <p className="py-6 text-center text-danger-700 text-sm">
            搜尋失敗：
            {results.error instanceof Error
              ? results.error.message
              : "請稍後再試"}
          </p>
        ) : (results.data?.items.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-ink-500 text-sm">
            找不到「{query}」
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {results.data?.items.map((user) => {
              const already = taken.includes(user._id);
              const label = user.name || user.email || "使用者";
              return (
                <li
                  key={user._id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Avatar src={user.avatar} name={user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium text-ink-900 text-sm">
                      {label}
                      {user.identity && (
                        <Badge
                          tone={user.identity === "alumni" ? "warn" : "mute"}
                        >
                          {IDENTITY_LABEL[user.identity] ?? user.identity}
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-ink-500 text-xs">
                      {[user.code, user.class, user.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {already ? (
                    <Badge tone="info">{takenLabel}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onPick(user)}
                      aria-label={`選擇 ${label}`}
                    >
                      選擇
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

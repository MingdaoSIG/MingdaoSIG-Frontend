"use client";

import Image from "next/image";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

import Linkify from "@/components/Linkify/Linkify";
import type { TComments } from "@/interfaces/comments";
import { imageUrl } from "@/modules/imageUrl";
import relativeTime from "@/modules/relativeTime";
import { jumpOut } from "@/utils/jumpOut";
import { isSubmitEnter } from "@/utils/keyboard";

import {
  COMMENT_MAX_LENGTH,
  commentAuthorName,
  isEdited,
} from "../apis/CommentAPI";
import type { CommentsController } from "./useComments";

// One comment UI for the desktop comment card and the mobile comment
// section (contract v3 §4.7): edit and delete on your own comments, delete
// for SIG managers and admins, one level of replies that collapses when a
// thread has more than two, and 「（已編輯）」 on edited comments.

const DEFAULT_AVATAR = "/images/default-avatar.png";
/** Threads with more replies than this start collapsed. */
const VISIBLE_REPLIES = 2;

export type CommentVariant = "desktop" | "mobile";

function formatTime(value: string, variant: CommentVariant) {
  if (variant === "mobile") {
    return relativeTime(value ?? "");
  }
  const date = new Date(value ?? "");
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("zh-TW").split(" ")[0];
}

function Avatar({ src, size }: { src?: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={(!failed && imageUrl(src)) || DEFAULT_AVATAR}
      width={size}
      height={size}
      alt=""
      unoptimized
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

export function CommentEditForm({
  initial,
  variant,
  onSave,
  onCancel,
}: {
  initial: string;
  variant: CommentVariant;
  /** Resolves true when saved (the form then closes). */
  onSave: (content: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const tooLong = text.length > COMMENT_MAX_LENGTH;
  const unchanged = trimmed === initial.trim();
  const canSave = !saving && trimmed.length > 0 && !tooLong && !unchanged;
  const mobile = variant === "mobile";

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  async function save() {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const saved = await onSave(trimmed);
    setSaving(false);
    if (saved) {
      onCancel();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (isSubmitEnter(e)) {
      e.preventDefault();
      save();
    }
  }

  return (
    <form
      className="mt-1.5 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <textarea
        ref={ref}
        value={text}
        rows={2}
        aria-label="編輯留言"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        className={`w-full resize-none rounded-control border border-line-strong bg-surface px-3 py-2 text-ink-800 leading-[1.6] focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20 ${
          mobile ? "text-[16px]" : "text-sm"
        }`}
      />
      <div className="flex items-center gap-2">
        <span
          className={`text-xs tabular-nums ${
            tooLong ? "text-danger-700" : "text-ink-400"
          }`}
          aria-live="polite"
        >
          {text.length}/{COMMENT_MAX_LENGTH}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className={`cursor-pointer rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field ${
            mobile ? "h-10" : "h-8"
          }`}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className={`cursor-pointer rounded-control bg-brand-700 px-3 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            mobile ? "h-10" : "h-8"
          }`}
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
      </div>
    </form>
  );
}

function CommentEntry({
  comment,
  parent,
  controller,
  variant,
  onReport,
}: {
  comment: TComments;
  /** Set for a reply: the top-level comment it sits under. */
  parent?: TComments;
  controller: CommentsController;
  variant: CommentVariant;
  onReport?: (comment: TComments) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { permissions } = controller;
  const customId = comment.user?.customId;
  const name = comment.user?.name;
  const mobile = variant === "mobile";
  const isReply = Boolean(parent);
  const avatarSize = isReply ? 28 : 36;
  const canEdit = permissions.canEdit(comment);
  const canDelete = permissions.canDelete(comment);
  // Anyone but the author (logged-out visitors are asked to log in).
  const canReport = Boolean(onReport) && !canEdit && Boolean(comment.user);
  const time = formatTime(comment.createdAt, variant);

  const action = `cursor-pointer rounded-chip font-semibold text-ink-500 transition-colors ${
    mobile
      ? "-ml-2 min-h-10 px-2 text-[13px] active:text-brand-700"
      : "-ml-1.5 h-7 px-1.5 text-xs hover:bg-field hover:text-brand-700"
  }`;

  const avatar = <Avatar src={comment.user?.avatar} size={avatarSize} />;

  return (
    <div className="flex w-full items-start gap-2.5 text-left">
      {customId ? (
        <Link
          href={`/@${customId}`}
          className="shrink-0"
          tabIndex={-1}
          aria-hidden
        >
          {avatar}
        </Link>
      ) : (
        avatar
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          {customId ? (
            <Link
              href={`/@${customId}`}
              className={`shrink-0 font-semibold text-ink-900 hover:underline ${
                mobile ? "text-sm" : "text-[0.85rem]"
              }`}
            >
              {name || `@${customId}`}
            </Link>
          ) : (
            <span
              className={`font-semibold text-ink-500 ${
                mobile ? "text-sm" : "text-[0.85rem]"
              }`}
            >
              {commentAuthorName(comment)}
            </span>
          )}
          {customId && name && (
            <span className="min-w-0 truncate text-ink-500 text-xs">
              @{customId}
            </span>
          )}
          <span className="shrink-0 text-ink-500 text-xs">
            {time}
            {isEdited(comment) && <span>（已編輯）</span>}
          </span>
        </div>
        {editing ? (
          <CommentEditForm
            initial={comment.content}
            variant={variant}
            onSave={(content) => controller.edit(comment, content)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <p
              className={`mt-0.5 whitespace-pre-line break-words text-ink-700 leading-[1.65] ${
                mobile ? "text-[0.9375rem]" : "text-[0.9rem]"
              }`}
            >
              <Linkify
                componentDecorator={(decoratedHref, decoratedText, key) => (
                  <button
                    type="button"
                    key={key}
                    className="break-all text-left text-brand-700 underline decoration-brand-700/30 underline-offset-2 hover:decoration-current"
                    onClick={() => jumpOut(decoratedHref)}
                  >
                    {decoratedText}
                  </button>
                )}
              >
                {comment.content}
              </Linkify>
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <button
                type="button"
                className={action}
                onClick={() => controller.startReply(comment, parent)}
              >
                回覆
              </button>
              {canEdit && (
                <button
                  type="button"
                  className={action}
                  onClick={() => setEditing(true)}
                >
                  編輯
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className={`${action} ${
                    mobile ? "" : "hover:text-danger-700"
                  }`}
                  onClick={() => controller.remove(comment)}
                >
                  刪除
                </button>
              )}
              {canReport && (
                <button
                  type="button"
                  className={`${action} ${
                    mobile ? "" : "hover:text-danger-700"
                  }`}
                  onClick={() => onReport?.(comment)}
                >
                  檢舉
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** A top-level comment with its replies. */
export function CommentThread({
  comment,
  controller,
  variant,
  onReport,
}: {
  comment: TComments;
  controller: CommentsController;
  variant: CommentVariant;
  /** 檢舉 on comments by others. */
  onReport?: (comment: TComments) => void;
}) {
  const replies = comment.replies ?? [];
  const collapsible = replies.length > VISIBLE_REPLIES;
  const open = !collapsible || controller.expanded.has(comment._id);
  const mobile = variant === "mobile";
  const isTarget = controller.replyTarget?.parentId === comment._id;

  const toggle = collapsible && (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => controller.setThreadExpanded(comment._id, !open)}
      className={`flex cursor-pointer items-center gap-1.5 self-start font-semibold text-brand-700 hover:underline ${
        mobile ? "min-h-10 text-[13px]" : "h-7 text-xs"
      }`}
    >
      <span aria-hidden className="h-px w-5 bg-line-strong" />
      {open ? "收合回覆" : `查看 ${replies.length} 則回覆`}
    </button>
  );

  return (
    <div
      className={`flex flex-col ${
        mobile
          ? "gap-1 rounded-card border border-line bg-surface p-3"
          : "gap-1"
      } ${isTarget ? "ring-2 ring-brand-700/25" : ""} ${
        isTarget && !mobile ? "rounded-control" : ""
      }`}
    >
      <CommentEntry
        comment={comment}
        controller={controller}
        variant={variant}
        onReport={onReport}
      />
      {replies.length > 0 && (
        <div className="ml-[1.0625rem] flex flex-col gap-2 border-line border-l-2 pt-1 pl-3">
          {open &&
            replies.map((reply) => (
              <CommentEntry
                key={reply._id}
                comment={reply}
                parent={comment}
                controller={controller}
                variant={variant}
                onReport={onReport}
              />
            ))}
          {toggle}
        </div>
      )}
    </div>
  );
}

/** 「回覆 某某」 above the composer, with a way back to a plain comment. */
export function ReplyBanner({
  controller,
  variant,
}: {
  controller: CommentsController;
  variant: CommentVariant;
}) {
  const target = controller.replyTarget;
  if (!target) {
    return null;
  }
  return (
    <div
      className={`flex items-center gap-2 text-ink-700 ${
        variant === "mobile" ? "px-3 pt-2 text-[13px]" : "mb-2 text-xs"
      }`}
    >
      <span className="min-w-0 truncate">
        回覆 <span className="font-semibold text-ink-900">{target.name}</span>
      </span>
      <button
        type="button"
        onClick={controller.cancelReply}
        className={`shrink-0 cursor-pointer font-semibold text-brand-700 hover:underline ${
          variant === "mobile" ? "min-h-9 px-1" : ""
        }`}
      >
        取消回覆
      </button>
    </div>
  );
}

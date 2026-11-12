"use client";

import { Pencil, UserRound } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import Swal from "sweetalert2";
import { NotificationSettingsEntry } from "@/components/Notifications/NotificationSettings";
import { PortfolioEntry } from "@/components/Portfolio/PortfolioEntry";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import { useSigDirectory } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import { postUser } from "../apis/postUserAPI";
import { PanelBanner } from "./PanelBanner";

// The public profile's info panel (owner decision 2026-11-12, v4 4A, v3
// 6A): the banner header, name and @id, SIG chips in SIG colours, the bio,
// and post and like totals. Your own profile adds 「編輯個人簡介」 and
// 「個人專區」, with 通知設定 and 學習歷程 as before.

const DESCRIPTION_MAX = 300;

/**
 * The SIGs to show: those the user leads or advises (public), and on your
 * own profile the ones you are a member of (memberships are private).
 */
function useUserSigs(user: User, own: boolean) {
  const directory = useSigDirectory();
  const { userData } = useUserAccount();
  const id = user._id ?? "";
  const mine = new Set(own ? (userData?.sig ?? []) : []);
  return (directory.data ?? []).filter(
    (sig: Sig) =>
      mine.has(sig._id) ||
      sig.leader?.includes(id) ||
      sig.moderator?.includes(id),
  );
}

export function UserPanel({
  user,
  setUser,
  own,
  compact = false,
}: {
  user: User;
  setUser: (user: User) => void;
  own: boolean;
  /** Phones: the short banner strip. */
  compact?: boolean;
}) {
  const { token, updateUser } = useUserAccount();
  // `GET /user/:id` counts the visible posts and their likes.
  const totals =
    typeof user.postCount === "number" || typeof user.likeCount === "number"
      ? { posts: user.postCount ?? 0, likes: user.likeCount ?? 0 }
      : null;
  const sigs = useUserSigs(user, own);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const bioId = useId();

  async function save() {
    if (Array.from(draft).length > DESCRIPTION_MAX) {
      setError(`最多 ${DESCRIPTION_MAX} 字`);
      return;
    }
    setSaving(true);
    const result = await postUser({ description: draft }, token ?? "");
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setUser({ ...user, description: draft });
    updateUser({ description: draft });
    setEditing(false);
    void Swal.fire({
      toast: true,
      position: "top",
      icon: "success",
      title: "個人簡介已更新",
      showConfirmButton: false,
      timer: 2000,
    });
  }

  const button =
    "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-control px-3 font-semibold text-sm transition-colors";

  return (
    <section
      aria-label="個人資訊"
      className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
      data-user-panel
    >
      <PanelBanner avatar={user.avatar} badges={user.badge} strip={compact} />
      <div
        className={`flex flex-col gap-3 px-4 pb-4 ${compact ? "pt-7" : "pt-14"}`}
      >
        <div className="min-w-0">
          <h1 className="break-words font-bold text-ink-900 text-xl leading-snug [overflow-wrap:anywhere]">
            {user.name || `@${user.customId}`}
          </h1>
          {user.customId && (
            <p className="text-[13px] text-brand-800 [overflow-wrap:anywhere]">
              @{user.customId}
            </p>
          )}
        </div>
        {!compact && sigs.length > 0 && (
          <ul aria-label="SIG" className="flex flex-wrap gap-1.5">
            {sigs.map((sig) => {
              const color = resolveSigColor(sig) ?? BRAND_COLOR;
              return (
                <li key={sig._id} className="min-w-0 max-w-full">
                  <Link
                    href={`/@${sig.customId}`}
                    className="sig-text flex max-w-full items-center gap-1.5 rounded-chip bg-[color-mix(in_srgb,var(--sig-color)_12%,white)] px-2 py-0.5 font-semibold text-xs hover:underline"
                    style={{ ["--sig-color" as string]: color }}
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span className="min-w-0 truncate">{sig.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {compact ? null : editing ? (
          <div className="flex flex-col gap-2">
            <label
              htmlFor={bioId}
              className="font-semibold text-ink-900 text-sm"
            >
              個人簡介
            </label>
            <textarea
              id={bioId}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              rows={5}
              aria-invalid={Boolean(error) || undefined}
              className="w-full resize-y rounded-control border border-line bg-field px-3 py-2 text-ink-800 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-brand-700/30"
            />
            {error && (
              <p role="alert" className="text-danger-700 text-sm">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className={`${button} border border-line-strong bg-surface text-ink-800 hover:bg-field`}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                className={`${button} bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-60`}
                onClick={save}
                disabled={saving}
              >
                {saving ? "儲存中…" : "儲存"}
              </button>
            </div>
          </div>
        ) : (
          user.description && (
            <p className="whitespace-pre-line break-words text-ink-700 text-sm leading-6">
              {user.description}
            </p>
          )
        )}
        {!compact && totals && (
          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-control bg-field px-3 py-2">
              <dt className="text-ink-500 text-xs">貼文</dt>
              <dd className="font-bold text-ink-900 text-lg tabular-nums">
                {totals.posts}
              </dd>
            </div>
            <div className="rounded-control bg-field px-3 py-2">
              <dt className="text-ink-500 text-xs">獲得讚</dt>
              <dd className="font-bold text-ink-900 text-lg tabular-nums">
                {totals.likes}
              </dd>
            </div>
          </dl>
        )}
        {own && !editing && !compact && (
          <div className="flex gap-2">
            <button
              type="button"
              className={`${button} border border-line-strong bg-surface text-ink-800 hover:bg-field`}
              onClick={() => {
                setDraft(user.description ?? "");
                setError(null);
                setEditing(true);
              }}
            >
              <Pencil aria-hidden className="size-4" />
              編輯個人簡介
            </button>
            <Link
              href="/me"
              className={`${button} bg-brand-700 text-white hover:bg-brand-800`}
            >
              <UserRound aria-hidden className="size-4" />
              個人專區
            </Link>
          </div>
        )}
        {own && !compact && (
          <div className="flex flex-col gap-3 border-line border-t pt-3">
            <NotificationSettingsEntry />
            <PortfolioEntry />
          </div>
        )}
      </div>
    </section>
  );
}

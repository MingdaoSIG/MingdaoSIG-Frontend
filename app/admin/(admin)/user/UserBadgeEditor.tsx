"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import {
  badgeIconUrl,
  type Badge as SiteBadge,
  useBadges,
} from "@/modules/badges";
import { failureMessage, send } from "../api";
import { Badge, Button, Spinner } from "../components/ui";
import { type AdminBadge, useAdminBadges } from "../sigAdminApi";
import type { BadgeId } from "../types";

// The user drawer's 徽章 (contract v4 §5.9): every badge of the
// collection (GET /admin/badges), so a badge made in 徽章 can be given
// right away. A retired badge the user still has is listed, checked, and
// can be taken away but not given again. Saved with
// POST /admin/users/:id/badges.

export function BadgeIcon({
  badge,
  size = 18,
}: {
  badge: Pick<SiteBadge, "key" | "icon" | "iconPath" | "name" | "color">;
  size?: number;
}) {
  const src = badgeIconUrl(badge);
  if (src) {
    return (
      // biome-ignore lint/performance/noImgElement: SVGs from public/ and API image ids
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        backgroundColor: badge.color || "#0b5a83",
      }}
    >
      {Array.from(badge.name)[0]}
    </span>
  );
}

export function UserBadgeEditor({
  userId,
  saved,
  onSaved,
}: {
  userId: string;
  saved: BadgeId[];
  onSaved: (badges: BadgeId[]) => void;
}) {
  const admin = useAdminBadges();
  const site = useBadges();
  // The admin list has retired badges too; the public one is the fallback.
  const all: AdminBadge[] = admin.data ?? (admin.isError ? site.badges : []);
  const pending = admin.isPending && !admin.isError;
  const [badges, setBadges] = useState<BadgeId[]>(saved);
  const [busy, setBusy] = useState(false);
  const savedKey = saved.slice().sort().join(",");
  const changed = badges.slice().sort().join(",") !== savedKey;

  useEffect(() => {
    setBadges(saved);
  }, [userId, savedKey]);

  const options = useMemo(() => {
    const known = new Set(all.map((badge) => badge.key));
    const list = all.filter(
      (badge) => !badge.removed || saved.includes(badge.key),
    );
    // Keys the user has that the list does not know (deleted by hand).
    for (const key of saved) {
      if (!known.has(key)) {
        list.push({ key, name: key, removed: true });
      }
    }
    return list;
  }, [all, savedKey]);

  const save = async () => {
    setBusy(true);
    const result = await send<{ badge?: BadgeId[] }>(
      `/admin/users/${userId}/badges`,
      { body: { badges } },
    );
    setBusy(false);
    if (!result.ok) {
      toast.error(failureMessage(result));
      return;
    }
    onSaved(Array.isArray(result.data?.badge) ? result.data.badge : badges);
    toast.success("已更新徽章");
  };

  if (pending) {
    return <Spinner />;
  }

  return (
    <>
      <fieldset>
        <legend className="sr-only">徽章</legend>
        {options.length === 0 ? (
          <p className="text-ink-500 text-sm">
            還沒有任何徽章，可以到「徽章」新增。
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {options.map((badge) => {
              const checked = badges.includes(badge.key);
              const retired = Boolean(badge.removed);
              return (
                <label
                  key={badge.key}
                  className={`flex items-center gap-2 rounded-control px-1 py-1 text-sm ${
                    retired && !checked
                      ? "cursor-not-allowed text-ink-400"
                      : "cursor-pointer text-ink-800 hover:bg-field"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={retired && !checked}
                    onChange={(event) =>
                      setBadges((prev) =>
                        event.target.checked
                          ? [...prev, badge.key]
                          : prev.filter((key) => key !== badge.key),
                      )
                    }
                    className="size-4 cursor-pointer accent-brand-700 disabled:cursor-not-allowed"
                  />
                  <BadgeIcon badge={badge} />
                  <span className="min-w-0 truncate">{badge.name}</span>
                  {retired && <Badge tone="mute">已停用</Badge>}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>
      {admin.isError && (
        <p className="mt-1 text-ink-500 text-xs">
          無法讀取完整的徽章清單，只列出公開的徽章。
        </p>
      )}
      <Button
        size="sm"
        variant="primary"
        className="mt-2"
        onClick={save}
        disabled={!changed}
        loading={busy}
      >
        儲存徽章
      </Button>
    </>
  );
}

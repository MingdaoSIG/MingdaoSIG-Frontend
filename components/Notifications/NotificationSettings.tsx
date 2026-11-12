"use client";

import { useEffect, useState } from "react";
import { postUser } from "@/app/[userID]/(User)/apis/postUserAPI";
import { Modal } from "@/components/Modal";
import type {
  NotificationSettingsPatch,
  PushNotificationType,
} from "@/interfaces/Notification";
import {
  mergeNotificationSettings,
  resolveNotificationSettings,
} from "@/modules/notifications/settings";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";
import { InstallSetting } from "./InstallPrompt";
import { PushControl } from "./PushControl";
import { SettingSwitch } from "./SettingSwitch";

// Notification settings on your own profile (api-contract-v4 §2.2):
// push on this device, which types to push, the comment email and the
// weekly digest (opt-in). Each switch saves at once with `POST /user`
// and flips back if the backend refuses.

/** Opens the settings when the profile URL ends with this hash. */
export const NOTIFICATION_SETTINGS_HASH = "#notification-settings";

const PUSH_LABELS: {
  type: PushNotificationType;
  label: string;
  managersOnly?: boolean;
}[] = [
  { type: "comment", label: "有人留言在我的貼文" },
  { type: "reply", label: "有人回覆我的留言" },
  { type: "like", label: "有人對我的貼文按讚" },
  { type: "feedback", label: "老師給了我的貼文回饋" },
  { type: "event", label: "我的 SIG 有新活動" },
  { type: "join_result", label: "我的入社申請有結果" },
  {
    type: "join_request",
    label: "有人申請加入我管理的 SIG",
    managersOnly: true,
  },
];

type SettingKey =
  | `push.${PushNotificationType}`
  | "email.comment"
  | "email.digest";

function patchFor(key: SettingKey, value: boolean): NotificationSettingsPatch {
  const [group, name] = key.split(".") as ["push" | "email", string];
  return { [group]: { [name]: value } };
}

export function NotificationSettingsPanel({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const { userData, token, updateUser } = useUserAccount();
  const { canOpenAdmin } = useAdminChrome();
  const settings = resolveNotificationSettings(userData);
  const [pending, setPending] = useState<Partial<Record<SettingKey, boolean>>>(
    {},
  );
  const [errors, setErrors] = useState<Partial<Record<SettingKey, string>>>({});

  function value(key: SettingKey) {
    const saved =
      key === "email.comment"
        ? settings.email.comment
        : key === "email.digest"
          ? settings.email.digest
          : settings.push[key.slice(5) as PushNotificationType];
    return pending[key] ?? saved;
  }

  async function save(key: SettingKey, next: boolean) {
    if (!token || pending[key] !== undefined) {
      return;
    }
    setPending((p) => ({ ...p, [key]: next }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    const patch = patchFor(key, next);
    const result = await postUser({ notificationSettings: patch }, token);
    if (result.ok) {
      updateUser((user) => ({
        ...user,
        notificationSettings: mergeNotificationSettings(
          user.notificationSettings,
          patch,
        ),
        // The same setting under its older name.
        ...(key === "email.comment" ? { notifyComments: next } : {}),
      }));
    } else {
      setErrors((e) => ({ ...e, [key]: `沒有儲存：${result.message}` }));
    }
    setPending((p) => {
      const { [key]: _done, ...rest } = p;
      return rest;
    });
  }

  function settingSwitch(key: SettingKey, label: string, hint?: string) {
    return (
      <SettingSwitch
        key={key}
        label={label}
        hint={hint}
        mobile={mobile}
        checked={value(key)}
        busy={pending[key] !== undefined}
        error={errors[key]}
        onChange={(next) => void save(key, next)}
      />
    );
  }

  const heading = `font-bold text-ink-900 ${mobile ? "text-base" : "text-[0.95rem]"}`;

  return (
    <div className="flex flex-col gap-4" data-notification-settings>
      <section className="flex flex-col gap-2">
        <h3 className={heading}>{mobile ? "手機通知" : "這台裝置的通知"}</h3>
        <PushControl mobile={mobile} />
      </section>

      <section className="border-line border-t pt-3">
        <h3 className={heading}>要通知我的事</h3>
        <p className="text-ink-500 text-xs leading-5">
          套用到你開啟通知的每一台裝置。
        </p>
        <div className="mt-1 divide-y divide-line">
          {PUSH_LABELS.filter((item) => !item.managersOnly || canOpenAdmin).map(
            (item) => settingSwitch(`push.${item.type}`, item.label),
          )}
        </div>
      </section>

      <section className="border-line border-t pt-3">
        <h3 className={heading}>Email</h3>
        <div className="divide-y divide-line">
          {settingSwitch(
            "email.comment",
            "有人留言時寄信通知我",
            "有人留言在你的貼文，或回覆你的留言時，寄信到你的學校信箱。",
          )}
          {settingSwitch(
            "email.digest",
            "每週摘要",
            "每週一早上寄一封信，整理你的 SIG 過去 7 天的新貼文。",
          )}
        </div>
      </section>

      <InstallSetting mobile={mobile} />
    </div>
  );
}

export function NotificationSettingsDialog({
  open,
  onClose,
  mobile = false,
}: {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="通知設定">
      <NotificationSettingsPanel mobile={mobile} />
    </Modal>
  );
}

/**
 * The 「通知設定」 row on your own profile. The settings open in a dialog
 * (also from `#notification-settings`), so the profile card stays short.
 */
export function NotificationSettingsEntry({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const { userData } = useUserAccount();
  const [open, setOpen] = useState(false);
  const settings = resolveNotificationSettings(userData);

  useEffect(() => {
    if (window.location.hash === NOTIFICATION_SETTINGS_HASH) {
      setOpen(true);
    }
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold text-ink-800 ${
            mobile ? "text-sm" : "text-[0.9rem]"
          }`}
        >
          通知設定
        </p>
        <p className="text-ink-500 text-xs leading-5">
          <span className="whitespace-nowrap">手機通知與 Email</span>
          {"・"}
          <span className="whitespace-nowrap">
            留言通知信{settings.email.comment ? "開" : "關"}
          </span>
          {"・"}
          <span className="whitespace-nowrap">
            每週摘要{settings.email.digest ? "開" : "關"}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 cursor-pointer rounded-control border border-line-strong bg-surface px-3.5 font-semibold text-brand-700 text-sm transition-colors hover:bg-field ${
          mobile ? "h-11" : "h-9"
        }`}
      >
        設定
      </button>
      <NotificationSettingsDialog
        open={open}
        mobile={mobile}
        onClose={() => {
          setOpen(false);
          if (window.location.hash === NOTIFICATION_SETTINGS_HASH) {
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}${window.location.search}`,
            );
          }
        }}
      />
    </div>
  );
}

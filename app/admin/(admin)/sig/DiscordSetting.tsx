"use client";

import { CircleCheck, Send, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { adminKeys, failureMessage, send, useInvalidate } from "../api";
import { useConfirm } from "../components/Modal";
import { Badge, Button, Card, Field, inputClass } from "../components/ui";
import type { AdminSig } from "../types";

// Discord 通知 in 基本資料 (contract v4 §3.6): a webhook URL that gets a
// message for every new post of the SIG. The URL is a secret: the API
// never returns it, only `discordWebhookSet`, so the field starts empty
// and saving replaces whatever was set. 測試 sends a test message;
// 清除 removes the webhook.

export const DISCORD_WEBHOOK_PATTERN =
  /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export function DiscordSetting({ sig }: { sig: AdminSig }) {
  const invalidate = useInvalidate();
  const confirm = useConfirm();
  const inputId = useId();
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState<"save" | "test" | "clear" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  // null: unknown (the announcement SIG is read without the flag).
  const isSet = sig.discordWebhookSet ?? null;

  const value = url.trim();
  const invalid = value !== "" && !DISCORD_WEBHOOK_PATTERN.test(value);

  const refresh = () => invalidate(adminKeys.sigs);

  const save = async () => {
    setTouched(true);
    if (!value || invalid) {
      setError(
        value
          ? "這不是 Discord Webhook 網址，請到 Discord 複製完整網址"
          : "請貼上 Webhook 網址",
      );
      return;
    }
    setBusy("save");
    setError(null);
    setResult(null);
    const response = await send(`/sig/${sig._id}`, {
      body: { discordWebhook: value },
    });
    setBusy(null);
    if (!response.ok) {
      const message =
        response.status === CustomStatus.INVALID_BODY
          ? "這不是 Discord Webhook 網址，請到 Discord 複製完整網址"
          : failureMessage(response, "你沒有權限編輯這個 SIG");
      setError(message);
      toast.error(message);
      return;
    }
    setUrl("");
    setTouched(false);
    toast.success("已設定 Discord 通知，可以按「測試」確認");
    await refresh();
  };

  const test = async () => {
    setBusy("test");
    setError(null);
    setResult(null);
    const response = await apiRequest<{ ok?: boolean }>(
      `/sig/${sig._id}/discord/test`,
      { method: "POST", auth: true },
    );
    setBusy(null);
    if (!response.ok) {
      const message = failureMessage(response, "你沒有權限測試這個 SIG");
      setError(message);
      toast.error(message);
      return;
    }
    if (response.data?.ok) {
      setResult("已送出測試訊息，請到 Discord 頻道確認");
      toast.success("已送出測試訊息");
      return;
    }
    const message =
      isSet === false
        ? "還沒有設定 Webhook，請先貼上網址並儲存"
        : "Discord 沒有收下測試訊息：Webhook 可能已被刪除，請重新建立後再設定";
    setError(message);
    toast.error("測試失敗");
  };

  const clear = async () => {
    const ok = await confirm({
      title: "清除 Discord 通知？",
      description: "之後這個 SIG 有新貼文時，不會再通知 Discord 頻道。",
      confirmLabel: "清除",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setBusy("clear");
    setError(null);
    setResult(null);
    const response = await send(`/sig/${sig._id}`, {
      body: { discordWebhook: "" },
    });
    setBusy(null);
    if (!response.ok) {
      const message = failureMessage(response, "你沒有權限編輯這個 SIG");
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("已清除 Discord 通知");
    await refresh();
  };

  return (
    <Card
      title="Discord 通知"
      actions={
        isSet === true ? (
          <Badge tone="ok">
            <CircleCheck aria-hidden className="mr-1 size-3" />
            已設定
          </Badge>
        ) : isSet === false ? (
          <Badge tone="mute">未設定</Badge>
        ) : null
      }
    >
      <div className="flex max-w-2xl flex-col gap-4">
        <p className="text-ink-700 text-sm leading-relaxed">
          這個 SIG 有新貼文時，自動在 Discord 頻道貼出標題、摘要與連結。
        </p>
        <details className="rounded-control border border-line bg-field/60 px-3 py-2 text-ink-700 text-sm">
          <summary className="cursor-pointer font-semibold text-ink-800">
            怎麼建立 Webhook？
          </summary>
          <ol className="mt-2 ml-5 list-decimal space-y-1 leading-relaxed">
            <li>
              在 Discord 打開要接收通知的頻道，按頻道名稱旁的齒輪（編輯頻道）。
            </li>
            <li>
              選「整合」→「Webhook」→「新 Webhook」，取個名字（例如 MDSIG）。
            </li>
            <li>按「複製 Webhook 網址」，貼到下面的欄位後按「儲存」。</li>
            <li>按「測試」，頻道收到測試訊息就完成了。</li>
          </ol>
          <p className="mt-2 text-ink-500 text-xs">
            Webhook 網址等同發文權限，請不要公開。儲存後基於安全不會再顯示網址。
          </p>
        </details>

        <Field
          label={isSet ? "換成新的 Webhook 網址" : "Webhook 網址"}
          htmlFor={inputId}
          hint={
            touched && invalid ? (
              <span className="text-danger-700">
                網址格式應為 https://discord.com/api/webhooks/…
              </span>
            ) : (
              "https://discord.com/api/webhooks/ 開頭"
            )
          }
        >
          <input
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            aria-invalid={(touched && invalid) || undefined}
            placeholder={
              isSet
                ? "已設定（不顯示網址），貼上新網址可以替換"
                : "https://discord.com/api/webhooks/…"
            }
            className={`${inputClass} font-mono aria-[invalid=true]:border-danger-700`}
          />
        </Field>

        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}
        {result && (
          <output className="block text-ok-700 text-sm">{result}</output>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => void save()}
            loading={busy === "save"}
            disabled={Boolean(busy) || !value}
          >
            儲存
          </Button>
          <Button
            onClick={() => void test()}
            loading={busy === "test"}
            disabled={Boolean(busy) || isSet === false}
          >
            <Send aria-hidden className="size-3.5" />
            測試
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => void clear()}
            loading={busy === "clear"}
            disabled={Boolean(busy) || isSet === false}
          >
            <Trash2 aria-hidden className="size-3.5" />
            清除
          </Button>
        </div>
      </div>
    </Card>
  );
}

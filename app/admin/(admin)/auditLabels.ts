import type { BadgeTone } from "./components/ui";
import type { AuditAction, AuditEntry, AuditTargetKind } from "./types";

// Readable Chinese for the audit log (the backend's AUDIT_ACTIONS).

export const AUDIT_ACTIONS: {
  id: AuditAction;
  label: string;
  tone: BadgeTone;
}[] = [
  { id: "post.pin", label: "置頂貼文", tone: "info" },
  { id: "post.unpin", label: "取消置頂", tone: "mute" },
  { id: "post.remove", label: "下架貼文", tone: "danger" },
  { id: "post.restore", label: "復原貼文", tone: "ok" },
  { id: "comment.remove", label: "刪除留言", tone: "danger" },
  { id: "comment.restore", label: "復原留言", tone: "ok" },
  { id: "user.permission", label: "變更管理員權限", tone: "warn" },
  { id: "user.badges", label: "變更徽章", tone: "info" },
  { id: "sig.update", label: "編輯 SIG 資料", tone: "info" },
  { id: "sig.leader.add", label: "新增幹部", tone: "ok" },
  { id: "sig.leader.remove", label: "移除幹部", tone: "danger" },
  { id: "sig.moderator.add", label: "新增指導老師", tone: "ok" },
  { id: "sig.moderator.remove", label: "移除指導老師", tone: "danger" },
  { id: "sig.member.remove", label: "移除 SIG 成員", tone: "danger" },
  { id: "join.accept", label: "同意入社申請", tone: "ok" },
  { id: "join.reject", label: "拒絕入社申請", tone: "mute" },
];

const BY_ID = new Map(AUDIT_ACTIONS.map((action) => [action.id, action]));

export const TARGET_KINDS: { id: AuditTargetKind; label: string }[] = [
  { id: "post", label: "貼文" },
  { id: "comment", label: "留言" },
  { id: "user", label: "使用者" },
  { id: "sig", label: "SIG" },
  { id: "join", label: "入社申請" },
];

const FIELD_LABEL: Record<string, string> = {
  name: "名稱",
  description: "簡介",
  avatar: "頭像",
};

const BADGE_LABEL: Record<string, string> = {
  developer: "開發者",
  "10.21_user": "10/21 活動",
  bug_hunter: "抓蟲高手",
};

export function actionLabel(entry: AuditEntry) {
  if (
    entry.action === "user.permission" &&
    typeof entry.meta?.admin === "boolean"
  ) {
    return entry.meta.admin ? "設為管理員" : "移除管理員權限";
  }
  return BY_ID.get(entry.action as AuditAction)?.label ?? entry.action;
}

export function actionTone(entry: AuditEntry): BadgeTone {
  if (entry.action === "user.permission" && entry.meta?.admin === false) {
    return "danger";
  }
  return BY_ID.get(entry.action as AuditAction)?.tone ?? "mute";
}

export function targetKindLabel(kind: string) {
  return TARGET_KINDS.find((target) => target.id === kind)?.label ?? kind;
}

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

/** One line of extra facts from `meta`, or "". */
export function auditDetail(entry: AuditEntry) {
  const meta = entry.meta ?? {};
  const parts: string[] = [];
  const fields = list(meta.fields);
  if (fields.length > 0) {
    parts.push(`修改${fields.map((f) => FIELD_LABEL[f] ?? f).join("、")}`);
  }
  if (entry.action === "user.badges") {
    const badges = list(meta.badges);
    parts.push(
      badges.length > 0
        ? `徽章：${badges.map((b) => BADGE_LABEL[b] ?? b).join("、")}`
        : "移除所有徽章",
    );
  }
  const ids = list(meta.ids);
  if (ids.length > 1) {
    parts.push(`批次 ${ids.length} 篇`);
  }
  return parts.join(" · ");
}

/** The SIG an action happened in (`meta.sig`), if it says. */
export function auditSig(entry: AuditEntry) {
  const sig = entry.meta?.sig;
  return typeof sig === "string" && sig ? sig : "";
}

/**
 * What the action was done to. Leader, 指導老師, member and join actions
 * target the person (label = name) and say the SIG in `meta.sig`; a
 * comment's label is the start of its content.
 */
export function targetText(entry: AuditEntry, sigNames: Map<string, string>) {
  const label = entry.target.label || entry.target.id;
  const sig = auditSig(entry);
  const sigName = sig && entry.target.kind !== "sig" ? sigNames.get(sig) : "";
  return sigName ? `${label} · ${sigName}` : label;
}

/** Where the target can be seen, if anywhere. */
export function targetHref(entry: AuditEntry) {
  const { kind, id, label } = entry.target;
  const sig = auditSig(entry);
  if (sig && entry.action.startsWith("sig.member.")) {
    return `/admin/sigs/${sig}?tab=members`;
  }
  if (
    sig &&
    (entry.action.startsWith("sig.leader.") ||
      entry.action.startsWith("sig.moderator."))
  ) {
    return `/admin/sigs/${sig}?tab=staff`;
  }
  switch (kind) {
    case "post":
      return `/post/${id}`;
    case "sig":
      return `/admin/sigs/${id}`;
    case "user":
      return `/admin/users?q=${encodeURIComponent(label ?? "")}`;
    case "join":
      return sig ? `/admin/sigs/${sig}?tab=requests&status=all` : null;
    case "comment":
      return label
        ? `/admin/comments?status=all&q=${encodeURIComponent(label.slice(0, 100))}`
        : null;
    default:
      return null;
  }
}

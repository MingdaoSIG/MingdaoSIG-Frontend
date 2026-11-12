"use client";

import Link from "next/link";
import { errorText } from "../api";
import { linkClass, Spinner } from "../components/ui";
import { formatDateTime, formatRelative } from "../format";
import {
  describeUserAgent,
  LOGIN_METHOD_LABEL,
  type LoginEntry,
  useLogins,
} from "../moderationApi";

// 登入紀錄 in the user drawer (contract v4 §5.3, admins only): the newest
// logins, with 「查看全部」 opening the 登入紀錄 page for this user.

const SHOWN = 5;

/** The first characters of the IP hash: enough to compare two logins. */
export function shortHash(hash: string | undefined) {
  return hash ? hash.slice(0, 10) : "—";
}

export function LoginLine({ entry }: { entry: LoginEntry }) {
  const device = describeUserAgent(entry.userAgent);
  return (
    <>
      <span className="text-ink-800">
        <time
          dateTime={entry.createdAt}
          title={formatDateTime(entry.createdAt)}
        >
          {formatRelative(entry.createdAt)}
        </time>
        <span className="text-ink-500">
          {" "}
          · {LOGIN_METHOD_LABEL[entry.method] ?? entry.method}
        </span>
      </span>
      <span className="block truncate text-ink-500" title={entry.userAgent}>
        {device || "未知裝置"} · IP{" "}
        <code className="font-mono" title={entry.ipHash}>
          {shortHash(entry.ipHash)}
        </code>
      </span>
    </>
  );
}

export function LoginSection({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const logins = useLogins({ skip: 0, limit: SHOWN, user: userId });
  const items = logins.data?.items ?? [];
  const total = logins.data?.total ?? 0;

  if (logins.isPending) {
    return <Spinner />;
  }
  if (logins.isError) {
    return (
      <p role="alert" className="text-danger-700 text-xs">
        登入紀錄載入失敗：{errorText(logins.error)}
      </p>
    );
  }
  if (items.length === 0) {
    return <p className="text-ink-500 text-sm">近 180 天沒有登入紀錄</p>;
  }
  return (
    <>
      <ol className="flex flex-col gap-1.5">
        {items.map((entry) => (
          <li key={entry._id} className="min-w-0 text-xs">
            <LoginLine entry={entry} />
          </li>
        ))}
      </ol>
      <Link
        href={`/admin/logins?user=${userId}&userName=${encodeURIComponent(userName)}`}
        className={`${linkClass} mt-2 inline-block text-xs`}
      >
        {total > SHOWN ? `查看全部 ${total} 筆` : "在登入紀錄頁查看"}
      </Link>
    </>
  );
}

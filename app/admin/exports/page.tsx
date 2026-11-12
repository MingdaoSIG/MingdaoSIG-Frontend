"use client";

import { Download, Eye } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import sigAPI from "@/modules/sigAPI";
import {
  errorText,
  failureMessage,
  fetchSigMembers,
  useSigNames,
} from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import { SelectFilter } from "../(admin)/components/Filters";
import { Button, Card, Field, inputClass } from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDate, toDateInput } from "../(admin)/format";
import type { SigMember } from "../(admin)/types";
import {
  downloadMembers,
  downloadPosts,
  type PostExportRow,
} from "../(admin)/xlsx";

// 匯出與報表: the old 區間發文查詢 and 成員名單下載 in one page. Pick a
// range or a SIG, preview how many rows there are, then download Excel.

const PREVIEW_ROWS = 8;
/** Author lookups at a time (the API rate-limits bursts). */
const LOOKUP_CONCURRENCY = 4;

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
) {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await run(items[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

export default function AdminExportsPage() {
  return (
    <>
      <PageHeader
        title="匯出與報表"
        description="選擇範圍、先預覽筆數，再下載 Excel。"
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        <PostExport />
        <MemberExport />
      </div>
    </>
  );
}

function PostExport() {
  const { names } = useSigNames();
  const startId = useId();
  const endId = useId();
  const [start, setStart] = useState(
    toDateInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  );
  const [end, setEnd] = useState(toDateInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<PostExportRow[] | null>(null);
  const [range, setRange] = useState({ start, end });

  const invalidRange = !start || !end || start > end;

  const preview = async () => {
    if (invalidRange) {
      setError("開始日期要早於結束日期");
      return;
    }
    setLoading(true);
    setError("");
    setRows(null);
    const result = await apiRequest<TThread[]>("/post/list/range", {
      auth: true,
      query: { start, end },
    });
    if (!result.ok) {
      setLoading(false);
      setError(
        result.status === CustomStatus.INVALID_TIME_RANGE
          ? "日期區間無效，請重新選擇"
          : failureMessage(result, "這個帳號沒有管理員權限，無法匯出貼文"),
      );
      return;
    }
    const posts = Array.isArray(result.data) ? result.data : [];
    // One lookup per author; a deleted author shows 「未知」.
    const authorIds = Array.from(
      new Set(posts.map((post) => post.user).filter(Boolean)),
    );
    const lookups = await mapLimited(
      authorIds,
      LOOKUP_CONCURRENCY,
      (id) => sigAPI.getUserData(id) as Promise<User>,
    );
    const authors = new Map<string, string>();
    for (const lookup of lookups) {
      if (lookup?.status === "fulfilled" && lookup.value?._id) {
        authors.set(lookup.value._id, lookup.value.name ?? "");
      }
    }
    setRows(
      posts.map((post) => ({
        _id: post._id ?? "",
        title: post.title,
        sigName: names.get(post.sig) ?? "",
        author: authors.get(post.user) || "未知",
        createdAt: post.createdAt,
      })),
    );
    setRange({ start, end });
    setLoading(false);
  };

  const download = async () => {
    if (!rows || rows.length === 0) {
      return;
    }
    try {
      await downloadPosts(range.start, range.end, rows);
      toast.success(`已下載 ${rows.length} 篇貼文的紀錄`);
    } catch (failure) {
      console.error("Post export failed:", failure);
      toast.error("下載失敗，請稍後再試");
    }
  };

  return (
    <Card title="貼文匯出（區間發文）">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="開始日期" htmlFor={startId} className="sm:w-44">
          <input
            id={startId}
            type="date"
            value={start}
            max={end || undefined}
            onChange={(event) => {
              setStart(event.target.value);
              setRows(null);
            }}
            className={inputClass}
          />
        </Field>
        <Field label="結束日期" htmlFor={endId} className="sm:w-44">
          <input
            id={endId}
            type="date"
            value={end}
            min={start || undefined}
            onChange={(event) => {
              setEnd(event.target.value);
              setRows(null);
            }}
            className={inputClass}
          />
        </Field>
        <Button onClick={preview} loading={loading} disabled={invalidRange}>
          <Eye aria-hidden className="size-4" />
          預覽
        </Button>
      </div>
      <p className="mt-2 text-ink-500 text-xs">
        依發文日期（含頭尾兩天）列出未下架的貼文。
      </p>
      <ExportResult
        error={error}
        count={rows?.length}
        unit="篇"
        onDownload={download}
        headers={["日期", "標題", "SIG", "發文者"]}
        preview={(rows ?? []).slice(0, PREVIEW_ROWS).map((row) => ({
          key: row._id,
          cells: [
            formatDate(row.createdAt),
            row.title,
            row.sigName,
            row.author,
          ],
        }))}
      />
    </Card>
  );
}

function MemberExport() {
  const admin = useAdmin();
  const { sigs } = useSigNames();
  const [sigId, setSigId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<SigMember[] | null>(null);
  const sigName = useMemo(
    () => sigs.find((sig) => sig._id === sigId)?.name ?? "",
    [sigs, sigId],
  );

  const preview = async () => {
    if (!sigId) {
      return;
    }
    setLoading(true);
    setError("");
    setMembers(null);
    try {
      setMembers(await fetchSigMembers(sigId, { enrichWith: admin.token }));
    } catch (failure) {
      setError(errorText(failure));
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!members || members.length === 0) {
      return;
    }
    try {
      await downloadMembers(sigName, members);
      toast.success(`已下載 ${members.length} 位成員的名單`);
    } catch (failure) {
      console.error("Member export failed:", failure);
      toast.error("下載失敗，請稍後再試");
    }
  };

  return (
    <Card title="SIG 成員名單">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SelectFilter
          label="SIG"
          value={sigId}
          options={[
            { value: "", label: "選擇 SIG…" },
            ...sigs.map((sig) => ({ value: sig._id, label: sig.name })),
          ]}
          onChange={(next) => {
            setSigId(next);
            setMembers(null);
            setError("");
          }}
          className="sm:w-64"
        />
        <Button onClick={preview} loading={loading} disabled={!sigId}>
          <Eye aria-hidden className="size-4" />
          預覽
        </Button>
      </div>
      <p className="mt-2 text-ink-500 text-xs">
        欄位：學號、姓名、Email、班級。也可以在各 SIG 的「成員」分頁下載。
      </p>
      <ExportResult
        error={error}
        count={members?.length}
        unit="位"
        onDownload={download}
        headers={["學號", "姓名", "班級", "Email"]}
        preview={(members ?? []).slice(0, PREVIEW_ROWS).map((m) => ({
          key: m._id,
          cells: [m.code ?? "", m.name ?? "", m.class ?? "", m.email ?? ""],
        }))}
      />
    </Card>
  );
}

function ExportResult({
  error,
  count,
  unit,
  onDownload,
  headers,
  preview,
}: {
  error: string;
  count: number | undefined;
  unit: string;
  onDownload: () => void;
  headers: string[];
  preview: { key: string; cells: string[] }[];
}) {
  if (error) {
    return (
      <p role="alert" className="mt-4 text-danger-700 text-sm">
        {error}
      </p>
    );
  }
  if (count === undefined) {
    return null;
  }
  return (
    <div className="mt-4 border-line border-t pt-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-ink-900 text-sm">
          共 {formatCount(count)} {unit}
          {count > preview.length && (
            <span className="ml-1 font-normal text-ink-500">
              （預覽前 {preview.length} {unit}）
            </span>
          )}
        </p>
        <Button variant="primary" onClick={onDownload} disabled={count === 0}>
          <Download aria-hidden className="size-4" />
          下載 Excel
        </Button>
      </div>
      {count === 0 ? (
        <p className="mt-3 text-ink-500 text-sm">沒有資料可以下載。</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-control border border-line">
          <table className="w-full min-w-[28rem] table-fixed text-sm">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="h-8 border-line-strong border-b bg-field px-3 text-left font-semibold text-ink-500 text-xs"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr
                  key={row.key}
                  className="border-line border-b last:border-b-0"
                >
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${row.key}-${headers[index]}`}
                      className="h-9 truncate px-3 text-ink-700"
                      title={cell}
                    >
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

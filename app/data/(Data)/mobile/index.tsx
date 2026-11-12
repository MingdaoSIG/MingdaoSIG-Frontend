import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";
import styles from "./index.module.scss";

export default function Mobile() {
  const [sigData, setSigData] = useState<Sig | 0 | null>(null);
  const [message, setMessage] = useState(NOT_FOUND);
  const [searching, setSearching] = useState(false);

  async function searchSigData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements[0] as HTMLInputElement;
    const query = input.value.trim();
    if (!query || searching) {
      return;
    }
    // Accept "@mdcsl" (custom id) or a raw SIG id; anything else is
    // looked up as typed and simply comes back "not found".
    setSearching(true);
    const result = await apiRequest<Sig>(
      `/sig/${encodeURIComponent(query).replace(/^%40/, "@")}`,
    );
    setSearching(false);
    if (result.ok && typeof result.data?._id === "string") {
      setSigData(result.data);
      return;
    }
    // Any answer without a SIG (a non-2000 status, a malformed id…) means
    // there is no such SIG; only real failures say what went wrong.
    setMessage(
      result.ok ||
        result.kind === "not-found" ||
        result.kind === "error" ||
        result.kind === "unauthorized"
        ? NOT_FOUND
        : result.message,
    );
    setSigData(0);
  }

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 資料查詢系統</h1>
        </div>
        <div className={styles.content}>
          <div>
            <h1>SIG 資料查詢</h1>
            <form className={styles.searchForm} onSubmit={searchSigData}>
              <input
                type="text"
                placeholder="@mdcsl"
                aria-label="SIG 的 ID，例如 @mdcsl"
              />
              <button type="submit" disabled={searching}>
                {searching ? "查詢中…" : "查詢"}
              </button>
            </form>
            <div>
              {sigData === 0 && <p role="alert">{message}</p>}
              {sigData !== null && sigData !== 0 ? (
                <div className={styles.sigDataWrapper}>
                  <div>
                    <div className="flex items-center gap-3 text-left">
                      {sigData.avatar && (
                        <Image
                          src={sigData.avatar}
                          width={48}
                          height={48}
                          alt=""
                          className="size-12 shrink-0 rounded-full object-cover"
                          unoptimized
                        />
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-ink-900 text-lg">
                          {sigData.name}
                        </h2>
                        {sigData.customId && (
                          <p className="text-ink-500 text-sm">
                            @{sigData.customId}
                          </p>
                        )}
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm">
                      <dt className="text-ink-500">簡介</dt>
                      <dd className="whitespace-pre-line text-ink-800 [word-break:normal]">
                        {sigData.description || "尚未填寫"}
                      </dd>
                      <dt className="text-ink-500">指導老師</dt>
                      <dd className="text-ink-800">
                        {countOf(sigData.moderator)} 位
                      </dd>
                      <dt className="text-ink-500">幹部</dt>
                      <dd className="text-ink-800">
                        {countOf(sigData.leader)} 位
                      </dd>
                    </dl>
                    {sigData.customId && (
                      <Link
                        href={`/@${sigData.customId}`}
                        className="mt-4 inline-flex min-h-11 items-center font-semibold"
                      >
                        前往 SIG 頁面
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
            {/* <h1>使用者資料查詢</h1> */}
          </div>
        </div>
      </div>
    </div>
  );
}

const NOT_FOUND = "查無此 SIG";

function countOf(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

"use client";

import { useEffect, useState } from "react";
import { issueReportHref } from "@/modules/issueReports";

// Last-resort boundary for errors in the root layout itself. It replaces
// the whole document, so it cannot rely on the app's CSS: inline styles only.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reportHref, setReportHref] = useState(
    issueReportHref({ category: "bug", digest: error.digest }),
  );

  useEffect(() => {
    console.error("App crashed:", error);
    setReportHref(
      issueReportHref({
        category: "bug",
        from: `${window.location.pathname}${window.location.search}`,
        digest: error.digest,
      }),
    );
  }, [error]);

  const button: React.CSSProperties = {
    height: 40,
    padding: "0 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
  };

  return (
    <html lang="zh-Hant-TW">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fa",
          color: "#111d29",
          fontFamily: '"Noto Sans TC", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: 24,
            padding: 24,
            background: "#fff",
            border: "1px solid #dfe5eb",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>
            MDSIG 暫時無法顯示
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#586676" }}>
            很抱歉，網站發生錯誤。請重新載入；如果一直出現，請稍後再試。
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                ...button,
                border: "none",
                background: "#0b5a83",
                color: "#fff",
              }}
            >
              重試
            </button>
            <a
              href="/"
              style={{
                ...button,
                border: "1px solid #dfe5eb",
                color: "#111d29",
              }}
            >
              回首頁
            </a>
          </div>
          <p style={{ marginTop: 16, fontSize: 14 }}>
            {/* A full page load: the root layout is what failed. */}
            <a href={reportHref} style={{ color: "#0b5a83", fontWeight: 500 }}>
              回報這個問題
            </a>
          </p>
          {error.digest && (
            <p style={{ marginTop: 8, fontSize: 12, color: "#7a8694" }}>
              錯誤代碼：{error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}

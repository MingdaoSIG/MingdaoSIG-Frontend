"use client";

import Image from "next/image";
import type { TPortfolio, TPortfolioRole } from "@/interfaces/Engagement";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";

// The printable 學習歷程 document (design/api-contract-v4.md §3.1): the
// student, totals of the chosen posts, SIG history and the posts with
// their teacher feedback. On screen each post has a checkbox; posts left
// out are dimmed on screen and not printed. The print rules are in
// app/portfolio/print.css (data-print-* attributes).

const IDENTITY: Record<string, string> = {
  teacher: "老師",
  student: "學生",
  alumni: "校友",
};

const ROLE: Record<TPortfolioRole, string> = {
  member: "成員",
  leader: "幹部",
  moderator: "指導老師",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function count(value: number) {
  return value.toLocaleString("zh-TW");
}

export function PortfolioDocument({
  portfolio,
  selected,
  includeFeedback,
  onToggle,
  variant = "desktop",
}: {
  portfolio: TPortfolio;
  /** Ids of the posts to include. */
  selected: Set<string>;
  includeFeedback: boolean;
  /** Shows a checkbox on each post. */
  onToggle?: (postId: string) => void;
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";
  const { user } = portfolio;
  const chosen = portfolio.posts.filter((post) => selected.has(post._id));
  const totals = chosen.reduce(
    (sum, post) => ({
      likes: sum.likes + post.likes,
      comments: sum.comments + post.comments,
      views: sum.views + post.views,
    }),
    { likes: 0, comments: 0, views: 0 },
  );
  const feedbackCount = chosen.reduce(
    (sum, post) => sum + post.feedback.length,
    0,
  );
  const details = [
    user.class,
    IDENTITY[user.identity] ?? "",
    user.customId ? `@${user.customId}` : "",
  ].filter(Boolean);

  const stats = [
    { label: "收錄貼文", value: `${count(chosen.length)} 篇` },
    { label: "獲得讚", value: count(totals.likes) },
    { label: "留言", value: count(totals.comments) },
    { label: "瀏覽", value: count(totals.views) },
  ];

  return (
    <article
      data-print-sheet
      aria-label="學習歷程文件"
      className={`rounded-card border border-line bg-surface text-ink-800 shadow-card ${
        mobile ? "px-4 py-5" : "px-10 py-9"
      }`}
    >
      {/* Page 1: who, totals, SIG history */}
      <section aria-label="基本資料" className="flex flex-col gap-6">
        <header className="flex items-start gap-4 border-ink-900 border-b-2 pb-4">
          <Image
            src={imageUrl(user.avatar) ?? DEFAULT_AVATAR_URL}
            width={64}
            height={64}
            alt=""
            unoptimized
            className="size-16 shrink-0 rounded-full border border-line bg-field object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-700 text-xs tracking-[0.2em]">
              MDSIG 學習歷程
            </p>
            <h1 className="font-bold text-2xl text-ink-900 leading-tight">
              {user.name || "（未命名）"}
            </h1>
            {details.length > 0 && (
              <p className="mt-1 text-ink-500 text-sm">{details.join("・")}</p>
            )}
          </div>
          <p className="shrink-0 text-right text-ink-500 text-xs leading-5">
            產生日期
            <br />
            <time dateTime={portfolio.generatedAt}>
              {formatDate(portfolio.generatedAt)}
            </time>
          </p>
        </header>

        <dl
          className={`grid gap-3 ${mobile ? "grid-cols-2" : "grid-cols-4"}`}
          data-print-keep
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-control border border-line bg-field/60 px-4 py-3"
            >
              <dt className="text-ink-500 text-xs">{stat.label}</dt>
              <dd className="font-bold text-ink-900 text-xl tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="portfolio-sigs" data-print-keep>
          <h2
            id="portfolio-sigs"
            className="mb-2 font-bold text-base text-ink-900"
          >
            參與的 SIG
          </h2>
          {portfolio.sigs.length === 0 ? (
            <p className="text-ink-500 text-sm">尚未加入任何 SIG</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-line-strong border-b text-left text-ink-500 text-xs">
                  <th scope="col" className="py-1.5 pr-3 font-semibold">
                    SIG
                  </th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">
                    身分
                  </th>
                  <th scope="col" className="py-1.5 font-semibold">
                    加入日期
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.sigs.map((sig) => (
                  <tr key={sig._id} className="border-line border-b">
                    <td className="py-2 pr-3 font-semibold text-ink-900">
                      {sig.name}
                    </td>
                    <td className="py-2 pr-3 text-ink-700">
                      {sig.roles.map((role) => ROLE[role] ?? role).join("、") ||
                        "—"}
                    </td>
                    <td className="py-2 text-ink-700 tabular-nums">
                      {formatDate(sig.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </section>

      {/* Page 2 on: the posts */}
      <section
        aria-labelledby="portfolio-posts"
        className="mt-8 flex flex-col gap-4 print:mt-0"
        data-print-break
      >
        <h2
          id="portfolio-posts"
          className="flex items-baseline gap-2 border-ink-900 border-b-2 pb-2 font-bold text-ink-900 text-lg"
        >
          作品與貼文
          <span className="font-normal text-ink-500 text-sm">
            {count(chosen.length)} 篇
            {includeFeedback &&
              feedbackCount > 0 &&
              `・老師回饋 ${count(feedbackCount)} 則`}
          </span>
        </h2>
        {portfolio.posts.length === 0 && (
          <p className="text-ink-500 text-sm">還沒有發表過貼文</p>
        )}
        <ol className="flex flex-col gap-4">
          {portfolio.posts.map((post) => {
            const included = selected.has(post._id);
            return (
              <li
                key={post._id}
                data-print-keep
                data-print-hide={included ? undefined : true}
                data-portfolio-post={post._id}
                className={`flex gap-3 border-line border-b pb-4 last:border-b-0 ${
                  included ? "" : "opacity-45"
                }`}
              >
                {onToggle && (
                  <label
                    data-print-hide
                    className="flex shrink-0 cursor-pointer items-start pt-1"
                  >
                    <span className="sr-only">收錄「{post.title}」</span>
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => onToggle(post._id)}
                      className="size-[1.125rem] cursor-pointer accent-brand-700"
                    />
                  </label>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-bold text-base text-ink-900 leading-snug">
                    {post.title || "（無標題）"}
                  </h3>
                  <p className="mt-0.5 text-ink-500 text-xs">
                    {[
                      post.sig.name,
                      formatDate(post.createdAt),
                      `${count(post.likes)} 讚`,
                      `${count(post.comments)} 留言`,
                      `${count(post.views)} 次瀏覽`,
                    ]
                      .filter(Boolean)
                      .join("・")}
                  </p>
                  {post.excerpt && (
                    <p className="mt-1.5 line-clamp-4 text-[14px] text-ink-700 leading-[1.7] print:line-clamp-none">
                      {post.excerpt}
                    </p>
                  )}
                  {includeFeedback && post.feedback.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 rounded-control border-brand-700 border-l-[3px] bg-brand-50/60 px-3 py-2">
                      <p className="font-semibold text-brand-800 text-xs">
                        老師回饋
                      </p>
                      {post.feedback.map((entry) => (
                        <blockquote key={entry._id} className="text-sm">
                          <p className="whitespace-pre-wrap break-words text-ink-800 leading-[1.65]">
                            {entry.content}
                          </p>
                          <footer className="mt-0.5 text-ink-500 text-xs">
                            —— {entry.author.name || "指導老師"}，
                            {formatDate(entry.createdAt)}
                          </footer>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="mt-8 border-line border-t pt-3 text-ink-400 text-xs">
        {`本文件由 MDSIG 明道 SIG 分享平台（sig.mingdao.edu.tw）產生，資料截至 ${formatDate(portfolio.generatedAt)}。`}
      </footer>
    </article>
  );
}

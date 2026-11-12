"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PageColumns } from "@/app/(Layout)/pageColumns";
import { SectionErrorBoundary } from "@/components/ErrorBoundary/SectionErrorBoundary";
import { InfiniteThreadList } from "@/components/PostCard/InfiniteThreadList";
import { PostCard } from "@/components/PostCard/PostCard";
import { postListFetcher } from "@/components/PostCard/postListFetcher";
import { Highlight } from "@/components/Search/Highlight";
import { TopTags } from "@/components/Tags/TopTags";
import { getErrorMessage } from "@/modules/api/client";
import { tagHref } from "@/modules/hashtag";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { SEARCH_MAX_LENGTH, searchHref } from "@/modules/search";
import { isRecruitingNow } from "@/modules/sigRecruiting";
import { BRAND_COLOR, resolveSigColor } from "@/modules/sigTheme";
import useIsMobile from "@/utils/useIsMobile";
import { TWO_SIDES_MIN, useMinWidth } from "@/utils/useMinWidth";
import {
  type SearchSig,
  type SearchTag,
  type SearchUser,
  useUnifiedSearch,
  useUserSearch,
} from "@/utils/useSearch";

// /search?q=&type= (v3 2B): one results page with the tabs 全部 / 貼文 /
// SIG / 標籤 / 使用者 and the matches highlighted. 全部 shows the first few
// of each (`GET /search`); 貼文 pages through `/post/search`, 使用者
// through `/search/users`; SIG and 標籤 show up to 20.

type SearchType = "all" | "posts" | "sigs" | "tags" | "users";

const TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "posts", label: "貼文" },
  { value: "sigs", label: "SIG" },
  { value: "tags", label: "標籤" },
  { value: "users", label: "使用者" },
];

function isType(value: string | null): value is SearchType {
  return TYPES.some((type) => type.value === value);
}

function typeHref(q: string, type: SearchType) {
  const base = searchHref(q);
  if (type === "all") {
    return base;
  }
  return `${base}${base.includes("?") ? "&" : "?"}type=${type}`;
}

function SearchForm({
  q,
  type,
  mobile,
  autoFocus,
}: {
  q: string;
  type: SearchType;
  mobile: boolean;
  autoFocus: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  // Back / forward and header searches change `q` under the form.
  useEffect(() => {
    setValue(q);
  }, [q]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = value.trim();
    if (next === q) {
      return;
    }
    router.push(typeHref(next, type));
    inputRef.current?.blur();
  }

  return (
    <search className="w-full">
      <form onSubmit={onSubmit} className="flex w-full gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 focus-within:border-brand-700/50 focus-within:ring-2 focus-within:ring-brand-700/20">
          <Search size={18} className="shrink-0 text-ink-500" aria-hidden />
          <span className="sr-only">搜尋</span>
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={value}
            maxLength={SEARCH_MAX_LENGTH}
            onChange={(event) => setValue(event.target.value)}
            className={`h-11 min-w-0 flex-1 bg-transparent text-ink-900 focus:outline-none ${
              mobile ? "text-[16px]" : "text-[15px]"
            }`}
          />
        </label>
        <button
          type="submit"
          className="h-11 shrink-0 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800"
        >
          搜尋
        </button>
      </form>
    </search>
  );
}

function Tabs({
  q,
  value,
  counts,
}: {
  q: string;
  value: SearchType;
  counts: Partial<Record<SearchType, number>>;
}) {
  return (
    <nav aria-label="搜尋結果類型">
      <ul className="scrollbar-hide flex gap-1 overflow-x-auto border-line border-b">
        {TYPES.map((type) => {
          const active = type.value === value;
          const count = counts[type.value];
          return (
            <li key={type.value} className="shrink-0">
              <Link
                href={typeHref(q, type.value)}
                replace
                scroll={false}
                aria-current={active ? "page" : undefined}
                data-search-tab={type.value}
                className={`-mb-px flex h-11 items-center gap-1.5 border-b-2 px-3 font-semibold text-sm transition-colors ${
                  active
                    ? "border-brand-700 text-brand-700"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                }`}
              >
                {type.label}
                {typeof count === "number" && (
                  <span className="font-medium text-ink-400 text-xs tabular-nums">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Card({
  title,
  more,
  children,
}: {
  title?: string;
  more?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card lg:p-5">
      {(title || more) && (
        <div className="mb-3 flex items-center gap-2">
          {title && (
            <h2 className="flex-1 font-bold text-base text-ink-900">{title}</h2>
          )}
          {more}
        </div>
      )}
      {children}
    </section>
  );
}

function SigResults({
  sigs,
  q,
  single = false,
}: {
  sigs: SearchSig[];
  q: string;
  /** One per row (the narrow side column). */
  single?: boolean;
}) {
  return (
    <ul
      className={`grid grid-cols-1 gap-2 ${
        single ? "" : "sm:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]"
      }`}
    >
      {sigs.map((sig) => (
        <li key={sig._id} className="min-w-0">
          <Link
            href={sig.customId ? `/@${sig.customId}` : "/explore"}
            title={sig.name}
            data-search-sig={sig._id}
            className="flex min-w-0 items-center gap-3 rounded-control border border-line p-3 transition-colors hover:bg-field"
            style={{
              ["--sig-color" as string]: resolveSigColor(sig) ?? BRAND_COLOR,
            }}
          >
            <span
              aria-hidden
              className="sig-text flex size-10 shrink-0 items-center justify-center rounded-control border-[1.5px] border-[var(--sig-color)] bg-[color-mix(in_srgb,var(--sig-color)_18%,white)] font-bold"
            >
              {Array.from(sig.name)[0]}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="sig-text line-clamp-2 font-semibold text-[0.95rem] [overflow-wrap:anywhere]">
                <Highlight text={sig.name} query={q} />
              </span>
              <span className="text-ink-500 text-xs">
                {sig.customId && (
                  <>
                    @<Highlight text={sig.customId} query={q} />
                    {" · "}
                  </>
                )}
                {typeof sig.memberCount === "number"
                  ? `${sig.memberCount} 位成員`
                  : ""}
                {sig.recruiting &&
                isRecruitingNow({
                  recruiting: {
                    open: sig.recruiting.open !== false,
                    until: sig.recruiting.until ?? null,
                  },
                })
                  ? " · 招生中"
                  : ""}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TagResults({ tags, q }: { tags: SearchTag[]; q: string }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => {
        const href = tagHref(tag);
        return href ? (
          <li key={tag} className="min-w-0 max-w-full">
            <Link
              href={href}
              data-search-tag={tag}
              className="flex max-w-full items-center gap-1.5 rounded-chip bg-brand-50 px-2.5 py-1.5 font-medium text-brand-800 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--color-brand-700)_16%,white)]"
            >
              <span className="truncate">
                #<Highlight text={tag} query={q} />
              </span>
              <span className="shrink-0 text-ink-500 text-xs tabular-nums">
                {count}
              </span>
            </Link>
          </li>
        ) : null;
      })}
    </ul>
  );
}

function UserResults({ users, q }: { users: SearchUser[]; q: string }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
      {users.map((user) => (
        <li key={user._id} className="min-w-0">
          <Link
            href={user.customId ? `/@${user.customId}` : "/search"}
            data-search-user={user._id}
            className="flex min-w-0 items-center gap-3 rounded-control border border-line p-3 transition-colors hover:bg-field"
          >
            <Image
              src={imageUrl(user.avatar) ?? DEFAULT_AVATAR_URL}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full bg-field object-cover"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold text-[0.95rem] text-ink-900">
                <Highlight text={user.name ?? ""} query={q} />
              </span>
              {user.customId && (
                <span className="truncate text-ink-500 text-xs">
                  @<Highlight text={user.customId} query={q} />
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-10 text-center text-ink-500 text-sm">
      {children}
    </p>
  );
}

function LoadError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center text-ink-500 text-sm shadow-card"
    >
      <p>{getErrorMessage(error)}</p>
      <button
        type="button"
        onClick={retry}
        className="h-10 cursor-pointer rounded-control border border-line-strong px-4 font-semibold text-ink-800 hover:bg-field"
      >
        重試
      </button>
    </div>
  );
}

const moreLink =
  "shrink-0 font-semibold text-brand-700 text-sm hover:underline";

/**
 * The 全部 tab. With `split` (≥1600px) the SIG and tag matches go to the
 * right column (AllSideResults) and this keeps posts and users.
 */
function AllResults({ q, split = false }: { q: string; split?: boolean }) {
  const search = useUnifiedSearch(q, 5);
  if (search.isPending) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        {["a", "b", "c"].map((key) => (
          <div
            key={key}
            className="h-32 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
    );
  }
  if (search.isError) {
    return (
      <LoadError error={search.error} retry={() => void search.refetch()} />
    );
  }
  const { posts, sigs, tags, users } = search.data;
  if (
    posts.data.length === 0 &&
    sigs.length === 0 &&
    tags.length === 0 &&
    users.length === 0
  ) {
    return (
      <Card>
        <p className="font-semibold text-ink-900">找不到符合「{q}」的結果</p>
        <p className="mt-1 mb-4 text-ink-500 text-sm">
          換個關鍵字試試，或看看熱門標籤：
        </p>
        <TopTags />
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4" data-search-all>
      {!split && sigs.length > 0 && (
        <Card
          title="SIG"
          more={
            sigs.length >= 5 && (
              <Link href={typeHref(q, "sigs")} className={moreLink}>
                查看全部
              </Link>
            )
          }
        >
          <SigResults sigs={sigs} q={q} />
        </Card>
      )}
      {posts.data.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <h2 className="flex-1 font-bold text-base text-ink-900">
              貼文
              <span className="ml-2 font-medium text-ink-400 text-sm">
                {posts.total}
              </span>
            </h2>
            {posts.total > posts.data.length && (
              <Link href={typeHref(q, "posts")} className={moreLink}>
                查看全部 {posts.total} 篇
              </Link>
            )}
          </div>
          {posts.data.map((post, index) => (
            <PostCard
              key={post._id}
              post={post}
              highlight={q}
              eager={index < 2}
            />
          ))}
        </section>
      )}
      {!split && tags.length > 0 && (
        <Card
          title="標籤"
          more={
            tags.length >= 5 && (
              <Link href={typeHref(q, "tags")} className={moreLink}>
                查看全部
              </Link>
            )
          }
        >
          <TagResults tags={tags} q={q} />
        </Card>
      )}
      {users.length > 0 && (
        <Card
          title="使用者"
          more={
            users.length >= 5 && (
              <Link href={typeHref(q, "users")} className={moreLink}>
                查看全部
              </Link>
            )
          }
        >
          <UserResults users={users} q={q} />
        </Card>
      )}
    </div>
  );
}

/** ≥1600px, 全部 tab: SIG and tag matches beside the posts. */
function AllSideResults({ q }: { q: string }) {
  const search = useUnifiedSearch(q, 5);
  if (!search.data) {
    return null;
  }
  const { sigs, tags } = search.data;
  if (sigs.length === 0 && tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4" data-search-side>
      {sigs.length > 0 && (
        <Card
          title="SIG"
          more={
            sigs.length >= 5 && (
              <Link href={typeHref(q, "sigs")} className={moreLink}>
                查看全部
              </Link>
            )
          }
        >
          <SigResults sigs={sigs} q={q} single />
        </Card>
      )}
      {tags.length > 0 && (
        <Card
          title="標籤"
          more={
            tags.length >= 5 && (
              <Link href={typeHref(q, "tags")} className={moreLink}>
                查看全部
              </Link>
            )
          }
        >
          <TagResults tags={tags} q={q} />
        </Card>
      )}
    </div>
  );
}

function SectionResults({ q, type }: { q: string; type: "sigs" | "tags" }) {
  const search = useUnifiedSearch(q, 20);
  if (search.isPending) {
    return (
      <div
        aria-hidden
        className="h-40 animate-pulse rounded-card border border-line bg-surface"
      />
    );
  }
  if (search.isError) {
    return (
      <LoadError error={search.error} retry={() => void search.refetch()} />
    );
  }
  if (type === "sigs") {
    return search.data.sigs.length === 0 ? (
      <Empty>沒有符合「{q}」的 SIG</Empty>
    ) : (
      <Card>
        <SigResults sigs={search.data.sigs} q={q} />
      </Card>
    );
  }
  return search.data.tags.length === 0 ? (
    <Empty>沒有符合「{q}」的標籤</Empty>
  ) : (
    <Card>
      <TagResults tags={search.data.tags} q={q} />
    </Card>
  );
}

function UserTab({ q }: { q: string }) {
  const search = useUserSearch(q);
  const users = search.data?.pages.flatMap((page) => page.items) ?? [];
  if (search.isPending) {
    return (
      <div
        aria-hidden
        className="h-40 animate-pulse rounded-card border border-line bg-surface"
      />
    );
  }
  if (search.isError && users.length === 0) {
    return (
      <LoadError error={search.error} retry={() => void search.refetch()} />
    );
  }
  if (users.length === 0) {
    return <Empty>沒有符合「{q}」的使用者</Empty>;
  }
  return (
    <Card>
      <UserResults users={users} q={q} />
      {search.hasNextPage && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={search.isFetchingNextPage}
            onClick={() => void search.fetchNextPage({ cancelRefetch: false })}
            className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-5 font-semibold text-ink-700 text-sm hover:bg-field disabled:cursor-wait"
          >
            {search.isFetchingNextPage ? "載入中…" : "載入更多"}
          </button>
        </div>
      )}
    </Card>
  );
}

function PostTab({ q }: { q: string }) {
  const fetchPage = useMemo(() => postListFetcher("/post/search", { q }), [q]);
  return (
    <InfiniteThreadList
      fetchPage={fetchPage}
      queryKey={["searchPosts", q]}
      pageSize={20}
      highlight={q}
      label={`「${q}」的貼文`}
      empty={<Empty>沒有符合「{q}」的貼文</Empty>}
    />
  );
}

function Results({
  q,
  type,
  split = false,
}: {
  q: string;
  type: SearchType;
  split?: boolean;
}) {
  if (type === "posts") {
    return <PostTab q={q} />;
  }
  if (type === "sigs" || type === "tags") {
    return <SectionResults q={q} type={type} />;
  }
  if (type === "users") {
    return <UserTab q={q} />;
  }
  return <AllResults q={q} split={split} />;
}

function StartState() {
  return (
    <Card>
      <p className="text-ink-700 text-sm">搜尋貼文、SIG、標籤和使用者。</p>
      <h2 className="mt-4 mb-3 font-bold text-base text-ink-900">熱門標籤</h2>
      <TopTags />
    </Card>
  );
}

export default function SearchPage() {
  const isMobile = useIsMobile();
  const wide = useMinWidth(TWO_SIDES_MIN);
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().slice(0, SEARCH_MAX_LENGTH);
  const requested = params.get("type");
  const type: SearchType = isType(requested) ? requested : "all";
  const overview = useUnifiedSearch(q, 5);
  const counts: Partial<Record<SearchType, number>> = overview.data
    ? { posts: overview.data.posts.total }
    : {};

  // Layout 1B: readable result cards; from 1600px the 全部 tab puts SIG
  // and tag matches in a right column.
  const split =
    !isMobile &&
    wide &&
    Boolean(q) &&
    type === "all" &&
    Boolean(overview.data?.sigs.length || overview.data?.tags.length);
  const body = (
    <>
      {q && <Tabs q={q} value={type} counts={counts} />}
      <SectionErrorBoundary label="搜尋結果">
        {q ? <Results q={q} type={type} split={split} /> : <StartState />}
      </SectionErrorBoundary>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 px-2 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <div className="shrink-0 rounded-card border border-line bg-surface p-2 shadow-card">
          <SearchForm q={q} type={type} mobile autoFocus={!q} />
        </div>
        <div
          data-search-results
          className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
        >
          {body}
        </div>
      </div>
    );
  }

  return (
    <PageColumns
      wideRight={split ? <AllSideResults q={q} /> : undefined}
      main={
        <div className="flex flex-col gap-4">
          <header className="rounded-card border border-line bg-surface px-6 py-5 shadow-card">
            <h1 className="mb-3 flex items-center gap-2 font-bold text-2xl text-ink-900 leading-[1.4]">
              搜尋
            </h1>
            <SearchForm q={q} type={type} mobile={false} autoFocus={!q} />
          </header>
          <div data-search-results className="flex flex-col gap-4">
            {body}
          </div>
        </div>
      }
    />
  );
}

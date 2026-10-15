"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InformationSkeleton } from "@/components/Information/desktop/Skeleton";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";

// Modules / Components
import maxMatch from "@/modules/maxMatch";
// APIs / Types
import { useTopPost } from "@/utils/usePost";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ----------------------
// Helpers
// ----------------------

type MinimalThread = Pick<TThread, "_id" | "title"> & { likes: number };

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: "heart" | "users";
  title: string;
  count?: number | string;
  action?: React.ReactNode;
}) {
  const Icon = icon === "heart" ? HeartIcon : UsersIcon;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-chip bg-brand-50 p-2 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="font-bold text-base text-ink-900 leading-7">
          {title}
          {typeof count !== "undefined" && (
            <span className="ml-2 font-medium text-ink-400 text-sm">
              {count}
            </span>
          )}
        </h2>
      </div>
      {action}
    </div>
  );
}

function TopPostRow({ _id, title, likes }: MinimalThread) {
  return (
    <Link
      href={`/post/${_id}`}
      className="group flex items-center justify-between gap-4 rounded-chip px-2 py-1.5 ring-1 ring-transparent transition hover:bg-white/60 hover:ring-line"
      aria-label={`Open post: ${title}`}
    >
      <h3 className="flex-1 truncate font-medium text-[0.95rem] text-ink-800">
        {title}
      </h3>
      <span className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-ink-500 text-xs">
        <HeartIcon className="h-3.5 w-3.5" aria-hidden />
        {likes}
      </span>
    </Link>
  );
}

function SigCard({ sig }: { sig: Sig }) {
  return (
    <Link
      href={`/@${sig.customId}`}
      className="block size-20 shrink-0 rounded-control"
      aria-label={`Open SIG: ${sig.name}`}
    >
      <div
        className="flex size-full flex-col items-center justify-center rounded-control border-[1.5px] border-[var(--sig-color)] bg-surface px-1 text-center font-semibold text-[11px] text-ink-800 leading-tight transition duration-150 hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--sig-color)_8%,white)]"
        style={{
          ["--sig-color" as string]: sigDefaultColors[sig._id] ?? "#0b5a83",
        }}
      >
        {maxMatch(sig.name).map((name) => (
          <span key={name} className="break-words">
            {name}
          </span>
        ))}
      </div>
    </Link>
  );
}

// ----------------------
// Main Component
// ----------------------

export default function Information() {
  // SIGs state
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [sigsLoading, setSigsLoading] = useState(true);
  const [sigsError, setSigsError] = useState<string | null>(null);
  const [sigQuery, setSigQuery] = useState("");

  // Fetch SIGs
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setSigsLoading(true);
        setSigsError(null);
        const url = API_URL ? `${API_URL}/sig/list` : "/sig/list";
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          headers: { "cache-control": "no-store" },
        });
        if (!res.ok) {
          throw new Error(`SIG list failed: ${res.status}`);
        }
        const json = await res.json();
        const all = (json?.data ?? []) as Sig[];
        setSigs(all);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setSigsError(err.message || "Failed to load SIGs.");
        }
      } finally {
        setSigsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // Top posts
  const pageSize = 3;
  const {
    data,
    isLoading: postsLoading,
    isError: postsError,
  } = useTopPost({ pageSize });

  const posts: MinimalThread[] = useMemo(() => {
    const raw: TThread[] = data?.pages?.[0] ?? [];

    return raw.map((item) => ({
      _id: item._id,
      title: item.title,
      likes:
        typeof item.likes === "number"
          ? item.likes
          : typeof item.like === "number"
            ? item.like
            : 0,
    }));
  }, [data]);

  // SIG filters
  const HIDDEN_SIG_ID = "652d60b842cdf6a660c2b778";
  const filteredSigs = useMemo(() => {
    const q = sigQuery.trim().toLowerCase();
    return sigs
      .filter((s) => s._id !== HIDDEN_SIG_ID)
      .filter((s) =>
        q
          ? s.name.toLowerCase().includes(q) ||
            (s.customId?.toLowerCase().includes(q) ?? false)
          : true,
      );
  }, [sigs, sigQuery]);

  const isLoading = postsLoading || sigsLoading;

  if (isLoading) {
    return <InformationSkeleton />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Top Posts */}
      <section className="glass shrink-0 rounded-card p-5">
        <SectionHeader icon="heart" title="Top 3 Posts" />
        <div className="mt-2">
          {postsError && (
            <p className="text-danger-700 text-sm">
              Failed to load posts. Please try again later.
            </p>
          )}

          {!postsError && posts.length === 0 && (
            <p className="text-ink-500 text-sm">
              No posts yet. Check back soon!
            </p>
          )}

          {!postsError && posts.length > 0 && (
            <ul className="flex flex-col gap-1">
              {posts.map((p) => (
                <li key={p._id}>
                  <TopPostRow _id={p._id} title={p.title} likes={p.likes} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* SIGs */}
      <section className="glass flex min-h-0 flex-1 flex-col rounded-card p-5">
        <SectionHeader
          icon="users"
          title="SIGs"
          count={filteredSigs.length}
          action={
            <div className="min-w-0 flex-[0_1_10.5rem]">
              <label htmlFor="sig-search" className="sr-only">
                Search SIGs
              </label>
              {/* Explicit width: the default (size=20) is wider in Firefox
                  and Safari than in Chrome and overflowed the card. */}
              <input
                id="sig-search"
                value={sigQuery}
                onChange={(e) => setSigQuery(e.target.value)}
                placeholder="Search SIGs..."
                className="w-full min-w-0 rounded-control bg-field px-3 py-1.5 text-ink-800 text-sm ring-1 ring-line placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/40"
              />
            </div>
          }
        />

        {/* py-1 leaves room so hovered tiles are not clipped by the scroller */}
        <div className="custom-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto">
          {sigsError && (
            <p className="px-0.5 text-danger-700 text-sm">{sigsError}</p>
          )}

          {!sigsError && (
            <ul className="flex flex-wrap items-start justify-center gap-4 px-0.5 py-1">
              {filteredSigs.map((sig) => (
                <li key={sig._id} className="list-none">
                  <SigCard sig={sig} />
                </li>
              ))}

              {filteredSigs.length === 0 && (
                <li className="w-full">
                  <div className="rounded-control border border-line border-dashed p-6 text-center text-ink-500 text-sm">
                    No SIGs match your search.
                  </div>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

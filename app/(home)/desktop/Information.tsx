"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// APIs / Types
import { useTopPost } from "@/utils/usePost";
import type { TThread } from "@/interfaces/Thread";
import type { Sig } from "@/interfaces/Sig";

// Modules / Components
import maxMatch from "@/modules/maxMatch";
import { InformationSkeleton } from "@/components/Information/desktop/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ----------------------
// Helpers
// ----------------------

type MinimalThread = Pick<TThread, "_id" | "title"> & { likes: number };

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SectionHeader({
  icon, title, count, action,
}: {
  icon: "heart" | "users";
  title: string;
  count?: number | string;
  action?: React.ReactNode;
}) {
  const Icon = icon === "heart" ? HeartIcon : UsersIcon;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-xl bg-[#e9f1ff] p-2">
          <Icon className="h-4 w-4 text-[#3c69b4]" aria-hidden />
        </span>
        <h2 className="text-lg font-bold text-[#3c69b4] leading-[1.8rem]">
          {title}
          {typeof count !== "undefined" && (
            <span className="ml-2 text-sm font-medium text-gray-400">{count}</span>
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
      className="group flex items-center justify-between gap-4 rounded-xl px-2 py-1.5 transition ring-1 ring-transparent hover:ring-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3c69b4]"
      aria-label={`Open post: ${title}`}
    >
      <h3 className="text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1 relative pb-1">
        {title}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full group-hover:origin-left origin-right" />
      </h3>
      <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
        <HeartIcon className="h-3.5 w-3.5" aria-hidden />
        {likes}
      </span>
    </Link>
  );
}

function SigCard({ sig }: { sig: Sig }) {
  // Stable single-element double-background border; avoid arbitrary sizes for Tailwind < v3
  const RADIUS = 16;
  return (
    <Link
      href={`/@${sig.customId}`}
      className="block w-20 h-20 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label={`Open SIG: ${sig.name}`}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center px-1 text-white text-[11px] leading-tight text-center rounded-2xl"
        style={{
          borderRadius: RADIUS,
          background:
            "linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2)) padding-box, linear-gradient(90deg, #6fa8ff, #30b4ac) border-box",
          border: "2px solid transparent",
        }}
      >
        {maxMatch(sig.name).map((name, index) => (
          <span key={index} className="break-words drop-shadow-[0_1px_0_rgba(0,0,0,0.15)]">{name}</span>
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
        if (!res.ok) throw new Error(`SIG list failed: ${res.status}`);
        const json = await res.json();
        const all = (json?.data ?? []) as Sig[];
        setSigs(all);
      } catch (err: any) {
        if (err?.name !== "AbortError") setSigsError(err?.message || "Failed to load SIGs.");
      } finally {
        setSigsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  // Top posts
  const pageSize = 3;
  const { data, isLoading: postsLoading, isError: postsError } = useTopPost({ pageSize });

  const posts: MinimalThread[] = useMemo(() => {
    const raw = Array.isArray((data as any)?.pages)
      ? ((data as any).pages?.[0] ?? [])
      : Array.isArray(data as any)
        ? (data as any)
        : [];

    return (raw as any[]).map((item) => ({
      _id: item._id,
      title: item.title,
      likes: typeof item.likes === "number" ? item.likes : typeof item.like === "number" ? item.like : 0,
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
          : true
      );
  }, [sigs, sigQuery]);

  const isLoading = postsLoading || sigsLoading;

  if (isLoading) return <InformationSkeleton />;

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className="p-6 bg-panel-bg rounded-[1.2rem] h-full overflow-hidden relative">
        <div className="flex flex-col gap-6 w-full h-full">
          {/* Top Posts */}
          <section>
            <SectionHeader icon="heart" title="Top 3 Posts" />
            <div className="mt-2 flex flex-col divide-y divide-gray-100">
              {postsError && (
                <p className="text-sm text-red-500">Failed to load posts. Please try again later.</p>
              )}

              {!postsError && posts.length === 0 && (
                <p className="text-sm text-gray-500">No posts yet. Check back soon!</p>
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
          <section className="flex-grow relative min-h-0">
            <SectionHeader
              icon="users"
              title="SIGs"
              count={filteredSigs.length}
              action={
                <div className="relative">
                  <label htmlFor="sig-search" className="sr-only">Search SIGs</label>
                  <input
                    id="sig-search"
                    value={sigQuery}
                    onChange={(e) => setSigQuery(e.target.value)}
                    placeholder="Search SIGs..."
                    className="pl-3 pr-3 py-1.5 rounded-lg bg-white text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c69b4]"
                  />
                </div>
              }
            />

            <div className="absolute top-[2.6rem] left-0 right-0 bottom-0 mt-2 overflow-y-auto custom-scrollbar">
              {sigsError && <p className="text-sm text-red-500 px-0.5">{sigsError}</p>}

              {!sigsError && (
                <ul className="flex flex-wrap items-start justify-center gap-4 px-0.5">
                  {filteredSigs.map((sig) => (
                    <li key={sig._id} className="list-none">
                      <SigCard sig={sig} />
                    </li>
                  ))}

                  {filteredSigs.length === 0 && (
                    <li className="col-span-full">
                      <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                        No SIGs match your search.
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

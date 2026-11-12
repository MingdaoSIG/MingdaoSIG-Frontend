// Shown while the post loads (it used to be an empty page). Same boxes as
// the loaded page, so nothing moves when the content arrives.

const LINES = [
  { id: "l1", width: "w-11/12" },
  { id: "l2", width: "w-full" },
  { id: "l3", width: "w-10/12" },
  { id: "l4", width: "w-9/12" },
  { id: "l5", width: "w-full" },
  { id: "l6", width: "w-8/12" },
  { id: "l7", width: "w-11/12" },
  { id: "l8", width: "w-7/12" },
];

function Lines({ count = LINES.length }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {LINES.slice(0, count).map((line) => (
        <div
          key={line.id}
          className={`h-4 rounded-chip bg-ink-900/8 ${line.width}`}
        />
      ))}
    </div>
  );
}

export function PostSkeleton({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <div
        aria-busy="true"
        className="absolute inset-0 flex animate-pulse flex-col gap-2 overflow-hidden px-2 pt-[calc(4.5rem+env(safe-area-inset-top))]"
      >
        <span className="sr-only">載入中…</span>
        <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card">
          <div className="size-11 shrink-0 rounded-control bg-field" />
          <div className="size-10 shrink-0 rounded-full bg-field" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-24 rounded-chip bg-field" />
            <div className="h-3 w-32 rounded-chip bg-field" />
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-card border border-line bg-paper px-4 pt-5 pb-6 shadow-card">
          <div className="h-6 w-4/5 rounded-chip bg-ink-900/8" />
          <div className="h-6 w-3/5 rounded-chip bg-ink-900/8" />
          <div className="my-1 h-px w-full bg-line" />
          <Lines />
        </div>
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      className="layout-split mx-auto grid w-[min(74rem,100%-4rem)] animate-pulse grid-cols-[minmax(0,1fr)_17.5rem] items-start gap-8"
    >
      <span className="sr-only">載入中…</span>
      <div className="post-body">
        <div className="mx-auto flex max-w-[42rem] flex-col gap-3">
          <div className="h-8 w-3/5 rounded-chip bg-ink-900/8" />
          <div className="h-3.5 w-40 rounded-chip bg-ink-900/8" />
          <div className="h-11 border-line border-y" />
        </div>
        <div className="markdown mt-8">
          <Lines />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 rounded-full bg-field" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-28 rounded-chip bg-field" />
              <div className="h-3 w-20 rounded-chip bg-field" />
            </div>
          </div>
          <div className="h-9 rounded-control bg-field" />
        </div>
      </div>
    </div>
  );
}

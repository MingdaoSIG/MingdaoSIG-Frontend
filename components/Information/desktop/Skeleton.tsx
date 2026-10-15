// Skeleton matching app/(home)/desktop/Information.tsx

const Bar = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-chip bg-ink-900/8 ${className}`} />
);

export const InformationSkeleton = () => {
  const topPosts = Array.from({ length: 3 });
  const sigs = Array.from({ length: 12 });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="glass shrink-0 rounded-card p-5">
        <div className="flex items-center gap-2">
          <Bar className="size-8" />
          <Bar className="h-5 w-28" />
        </div>
        <div className="mt-3 flex flex-col gap-3 px-2">
          {topPosts.map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
            <div key={`top-${index}`} className="flex justify-between gap-4">
              <Bar className="h-4 w-3/4" />
              <Bar className="h-4 w-8" />
            </div>
          ))}
        </div>
      </section>

      <section className="glass flex min-h-0 flex-1 flex-col rounded-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bar className="size-8" />
            <Bar className="h-5 w-16" />
          </div>
          <Bar className="h-8 w-[10.5rem]" />
        </div>
        <ul className="mt-3 flex flex-wrap justify-center gap-4 overflow-hidden px-0.5 py-1">
          {sigs.map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
            <li key={`sig-${index}`} className="list-none">
              <Bar className="size-20 rounded-control" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

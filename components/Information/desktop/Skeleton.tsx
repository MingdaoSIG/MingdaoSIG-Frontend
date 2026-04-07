// Tailwind-only skeleton matching Information.tsx structure

const TopPostSkeleton = () => (
  <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5">
    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
    <div className="h-3.5 w-12 flex-shrink-0 animate-pulse rounded bg-gray-200" />
  </div>
);

const SigCardSkeleton = () => (
  <div
    className="h-20 w-20 shrink-0 animate-pulse rounded-2xl"
    style={{
      borderRadius: 16,
      background:
        "linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.3)) padding-box, linear-gradient(90deg, #6fa8ff, #30b4ac) border-box",
      border: "2px solid transparent",
    }}
  />
);

const SectionHeaderSkeleton = ({
  hasCount = false,
  hasAction = false,
}: {
  hasCount?: boolean;
  hasAction?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {/* Icon placeholder */}
      <span className="inline-flex items-center justify-center rounded-xl bg-[#e9f1ff] p-2">
        <div className="h-4 w-4 animate-pulse rounded bg-[#3c69b4]/20" />
      </span>
      {/* Title placeholder */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
        {hasCount && (
          <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
        )}
      </div>
    </div>
    {/* Search box placeholder */}
    {hasAction && (
      <div className="h-9 w-36 animate-pulse rounded-lg bg-white ring-1 ring-gray-200" />
    )}
  </div>
);

export const InformationSkeleton = () => {
  const topPosts = Array.from({ length: 3 });
  const sigs = Array.from({ length: 21 });

  return (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="relative h-full overflow-hidden rounded-[1.2rem] bg-panel-bg p-6">
        <div className="flex h-full w-full flex-col gap-6">
          {/* Top Posts Section */}
          <section>
            <SectionHeaderSkeleton />
            <div className="mt-2 flex flex-col gap-1">
              {topPosts.map((_, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
                <TopPostSkeleton key={`top-post-skeleton-${index}`} />
              ))}
            </div>
          </section>

          {/* SIGs Section */}
          <section className="relative min-h-0 flex-grow">
            <SectionHeaderSkeleton hasCount hasAction />

            {/* Scrollable SIG list with absolute positioning */}
            <div className="absolute top-[2.6rem] right-0 bottom-0 left-0 mt-2 overflow-y-auto">
              <ul className="flex flex-wrap items-start justify-center gap-4 px-0.5">
                {sigs.map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no unique identifier
                  <li key={`sig-skeleton-${index}`} className="list-none">
                    <SigCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

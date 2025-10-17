// Tailwind-only skeleton matching Information.tsx structure

const TopPostSkeleton = () => (
  <div className="flex items-center justify-between gap-4 rounded-xl px-2 py-1.5">
    <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
    <div className="h-3.5 w-12 rounded bg-gray-200 animate-pulse flex-shrink-0" />
  </div>
);

const SigCardSkeleton = () => (
  <div
    className="w-20 h-20 shrink-0 rounded-2xl animate-pulse"
    style={{
      borderRadius: 16,
      background: "linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.3)) padding-box, linear-gradient(90deg, #6fa8ff, #30b4ac) border-box",
      border: "2px solid transparent",
    }}
  />
);

const SectionHeaderSkeleton = ({
  hasCount = false,
  hasAction = false
}: {
  hasCount?: boolean;
  hasAction?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {/* Icon placeholder */}
      <span className="inline-flex items-center justify-center rounded-xl bg-[#e9f1ff] p-2">
        <div className="h-4 w-4 rounded bg-[#3c69b4]/20 animate-pulse" />
      </span>
      {/* Title placeholder */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
        {hasCount && (
          <div className="h-4 w-8 rounded bg-gray-200 animate-pulse" />
        )}
      </div>
    </div>
    {/* Search box placeholder */}
    {hasAction && (
      <div className="h-9 w-36 rounded-lg bg-white ring-1 ring-gray-200 animate-pulse" />
    )}
  </div>
);

export const InformationSkeleton = () => {
  const topPosts = Array.from({ length: 3 });
  const sigs = Array.from({ length: 21 });

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className="p-6 bg-panel-bg rounded-[1.2rem] h-full overflow-hidden relative">
        <div className="flex flex-col gap-6 w-full h-full">
          {/* Top Posts Section */}
          <section>
            <SectionHeaderSkeleton />
            <div className="mt-2 flex flex-col gap-1">
              {topPosts.map((_, index) => (
                <TopPostSkeleton key={index} />
              ))}
            </div>
          </section>

          {/* SIGs Section */}
          <section className="flex-grow relative min-h-0">
            <SectionHeaderSkeleton hasCount hasAction />

            {/* Scrollable SIG list with absolute positioning */}
            <div className="absolute top-[2.6rem] left-0 right-0 bottom-0 mt-2 overflow-y-auto">
              <ul className="flex flex-wrap items-start justify-center gap-4 px-0.5">
                {sigs.map((_, index) => (
                  <li key={index} className="list-none">
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
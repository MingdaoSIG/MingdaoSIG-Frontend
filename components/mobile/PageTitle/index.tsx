// Title card at the top of mobile document pages. Matches the `.title`
// card the info and data pages build with their own stylesheets.
export function PageTitle({ title }: { title: string }) {
  return (
    <div className="flex h-12 w-full shrink-0 items-center rounded-card border border-line bg-surface px-4 shadow-card">
      <h1 className="scrollbar-hide w-full overflow-x-auto overflow-y-hidden whitespace-nowrap font-medium text-[1.75rem] text-ink-900 leading-7">
        {title}
      </h1>
    </div>
  );
}

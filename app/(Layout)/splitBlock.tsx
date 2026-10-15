import React from "react";

// Two-column desktop page (main + sticky side column). Pages using this
// scroll with the document (see `.layout-split` in globals.css).
const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="layout-split mx-auto mt-6 grid w-[min(80rem,100%-4rem)] grid-cols-[minmax(0,1fr)_22.5rem] items-start gap-6">
      <div className="min-w-0">{blocks[0]}</div>
      <aside
        data-shell="aside"
        className="sticky top-[5.5rem] flex h-[calc(100dvh-4rem-1.5rem-var(--dock-space))] min-h-[24rem] flex-col"
      >
        {blocks[1]}
      </aside>
    </div>
  );
};

export default SplitBlock;

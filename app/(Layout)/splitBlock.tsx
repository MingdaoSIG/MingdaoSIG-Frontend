import React from "react";

// Two-column desktop page (main + side column). The window scrolls (owner
// decision 2026-11-13): the main column grows with its content, and the
// side column sticks under the header (`--shell-top`), scrolling on its
// own only when it is taller than the window. Reader mode turns it into
// one column (content.css).
const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="layout-split mx-auto grid w-[min(80rem,100%-4rem)] grid-cols-[minmax(0,1fr)_22.5rem] items-start gap-6">
      <div data-split-main className="flex min-w-0 flex-col">
        {blocks[0]}
      </div>
      <aside
        data-shell="aside"
        className="custom-scrollbar sticky top-[var(--shell-top)] flex max-h-[calc(100dvh-var(--shell-top)-1rem)] min-h-0 flex-col self-start overflow-y-auto"
      >
        {blocks[1]}
      </aside>
    </div>
  );
};

export default SplitBlock;

import React from "react";

// Two-column desktop page (main + side column). It fills the shell's
// content row (between the header and the dock) and each column scrolls on
// its own, so the page itself never scrolls. Reader mode switches back to
// document scrolling (see globals.css and content.css).
const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="layout-split mx-auto grid h-full min-h-0 w-[min(80rem,100%-4rem)] grid-cols-[minmax(0,1fr)_22.5rem] gap-6">
      <div
        data-split-main
        className="custom-scrollbar flex min-h-0 min-w-0 flex-col overflow-y-auto"
      >
        {blocks[0]}
      </div>
      <aside data-shell="aside" className="flex min-h-0 flex-col">
        {blocks[1]}
      </aside>
    </div>
  );
};

export default SplitBlock;

import React from "react";

const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="mx-auto grid h-full w-[90vw] grid-cols-12 gap-4 overflow-hidden rounded-[1.5rem]">
      <div className="scrollbar-hide col-span-8 h-full max-w-[90vw] overflow-y-hidden rounded-[1.2rem] bg-transparent md:col-span-8 lg:col-span-8 xl:col-span-8">
        {blocks[0]}
      </div>
      <div className="col-span-4 h-full overflow-y-hidden md:col-span-4 lg:col-span-4 xl:col-span-4">
        {blocks[1]}
      </div>
    </div>
  );
};

export default SplitBlock;

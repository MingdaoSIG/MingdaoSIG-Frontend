import React from "react";

const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="mx-auto grid h-full w-[90vw] grid-cols-10 gap-4 overflow-hidden rounded-[1.8rem]">
      <div className="scrollbar-hide col-span-7 h-full max-w-[90vw] overflow-y-auto rounded-[1.2rem] bg-transparent md:col-span-5 lg:col-span-6 xl:col-span-7">
        {blocks[0]}
      </div>
      <div className="col-span-3 h-full overflow-y-hidden md:col-span-5 lg:col-span-4 xl:col-span-3">
        {blocks[1]}
      </div>
    </div>
  );
};

export default SplitBlock;

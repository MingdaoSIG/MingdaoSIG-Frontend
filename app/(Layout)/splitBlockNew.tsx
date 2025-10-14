import React from "react";

const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className="w-[90vw] h-full rounded-[1.8rem] mx-auto grid grid-cols-12 gap-4 overflow-hidden">
      <div className="col-span-8 max-w-[90vw] h-full rounded-[1.2rem] overflow-y-auto scrollbar-hide bg-transparent xl:col-span-8 lg:col-span-8 md:col-span-8">
        {blocks[0]}
      </div>
      <div className="h-full col-span-4 overflow-y-hidden xl:col-span-4 lg:col-span-4 md:col-span-4">
        {blocks[1]}
      </div>
    </div>
  );
};

export default SplitBlock;
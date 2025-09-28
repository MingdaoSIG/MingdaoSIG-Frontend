import React from "react";
import style from "./splitBlockNew.module.scss";

const SplitBlock = ({ children }: { children: React.ReactNode }) => {
  const blocks = React.Children.toArray(children);

  return (
    <div className={style.app}>
      <div className={style.mainview}>{blocks[0]}</div>
      <div className={style.second}>{blocks[1]}</div>
    </div>
  );
};

export default SplitBlock;

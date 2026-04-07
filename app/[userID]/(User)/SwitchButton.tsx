import { useState } from "react";
import type { TThread } from "@/interfaces/Thread";

const SwitchButton = ({
  callback,
  posts,
}: {
  callback: (value: number) => void;
  posts: TThread[];
}) => {
  const [buttonStyle, setButtonStyle] = useState("left-0");
  const [leftStyle, setLeftStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-white",
  );
  const [rightStyle, setRightStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-md-dark-green",
  );

  return (
    <div
      className={
        "relative flex select-none rounded-full bg-white bg-opacity-50" +
        (!posts?.length && "hidden")
      }
    >
      <div
        className={`absolute h-[56px] w-[100px] rounded-full bg-md-dark-green transition-all duration-500 ${buttonStyle}`}
      ></div>
      <button
        type="button"
        className={leftStyle}
        onClick={() => {
          setButtonStyle("left-0");
          callback(0);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white",
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green",
          );
        }}
      >
        Posts
      </button>
      <button
        type="button"
        className={rightStyle}
        onClick={() => {
          setButtonStyle("left-[100px]");
          callback(1);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green",
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white",
          );
        }}
      >
        Likes
      </button>
    </div>
  );
};

export default SwitchButton;

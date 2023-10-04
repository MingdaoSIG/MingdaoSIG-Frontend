import { useState } from "react";

const SwitchButton = ({
  callback,
  posts,
}: {
  callback: Function;
  posts: any;
}) => {
  const [buttonStyle, setButtonStyle] = useState("left-0");
  const [leftStyle, setLeftStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-white"
  );
  const [rightStyle, setRightStyle] = useState(
    "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
  );

  return (
    <div
      className={
        "flex bg-white bg-opacity-50 rounded-full relative " +
        (!posts?.length && "hidden")
      }
    >
      <div
        className={`transition-all duration-500 w-[100px] h-[56px] absolute bg-md-dark-green rounded-full ${buttonStyle}`}
      ></div>
      <button
        className={leftStyle}
        onClick={() => {
          setButtonStyle("left-0");
          callback(0);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white"
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
          );
        }}
      >
        Posts
      </button>
      <button
        className={rightStyle}
        onClick={() => {
          setButtonStyle("left-[100px]");
          callback(1);
          setLeftStyle(
            "py-4 w-[100px] text-center duration-500 relative text-md-dark-green"
          );
          setRightStyle(
            "py-4 w-[100px] text-center duration-500 relative text-white"
          );
        }}
      >
        Likes
      </button>
    </div>
  );
};

export default SwitchButton;

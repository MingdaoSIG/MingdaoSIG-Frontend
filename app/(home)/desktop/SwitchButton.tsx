import { useState } from "react";

const SwitchButton = ({
  callback,
}: {
  callback: Function;
}) => {
  const [buttonStyle, setButtonStyle] = useState("left-0");
  const [leftStyle, setLeftStyle] = useState(
    "w-[100px] text-center duration-500 relative text-white h-[3rem]"
  );
  const [rightStyle, setRightStyle] = useState(
    "w-[100px] text-center duration-500 relative text-md-dark-green h-[3rem]"
  );

  return (
    <div
      className={
        "flex bg-white bg-opacity-50 rounded-full relative select-none w-[200px] mb-[1rem] "
      }
    >
      <div
        className={`transition-all duration-500 w-[100px] h-[3rem] absolute bg-md-dark-green rounded-full ${buttonStyle}`}
      ></div>
      <button
        className={leftStyle}
        onClick={() => {
          setButtonStyle("left-0");
          callback(0);
          setLeftStyle(
            "w-[100px] text-center duration-500 relative text-white h-[3rem]"
          );
          setRightStyle(
            "w-[100px] text-center duration-500 relative text-md-dark-green h-[3rem]"
          );
        }}
      >
        Top
      </button>
      <button
        className={rightStyle}
        onClick={() => {
          setButtonStyle("left-[100px]");
          callback(1);
          setLeftStyle(
            "w-[100px] text-center duration-500 relative text-md-dark-green h-[3rem]"
          );
          setRightStyle(
            "w-[100px] text-center duration-500 relative text-white h-[3rem]"
          );
        }}
      >
        Latest
      </button>
    </div>
  );
};

export default SwitchButton;

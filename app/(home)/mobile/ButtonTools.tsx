import { useState } from "react";

type Props = {
  switchCallback: Function;
  sigListCallback: Function;
};

const ButtonTools = ({ switchCallback, sigListCallback }: Props) => {
  const [buttonStyle, setButtonStyle] = useState("left-0");
  const [leftStyle, setLeftStyle] = useState(
    "w-[5rem] text-center duration-500 relative text-white h-[2.5rem]"
  );
  const [rightStyle, setRightStyle] = useState(
    "w-[5rem] text-center duration-500 relative text-md-dark-green h-[2.5rem]"
  );

  return (
    <div className="flex flex-row justify-between items-center h-[4rem]">
      <div
        className={
          "flex bg-white bg-opacity-50 rounded-full relative select-none w-[10rem] my-3"
        }
      >
        <div
          className={`transition-all duration-500 w-[5rem] h-[2.5rem] absolute bg-md-dark-green rounded-full ${buttonStyle}`}
        ></div>
        <button
          className={leftStyle}
          onClick={() => {
            setButtonStyle("left-0");
            switchCallback(1);
            setLeftStyle(
              "w-[5rem] text-center duration-500 relative text-white h-[2.5rem]"
            );
            setRightStyle(
              "w-[5rem] text-center duration-500 relative text-md-dark-green h-[2.5rem]"
            );
          }}
        >
          Latest
        </button>
        <button
          className={rightStyle}
          onClick={() => {
            setButtonStyle("left-[5rem]");
            switchCallback(0);
            setLeftStyle(
              "w-[5rem] text-center duration-500 relative text-md-dark-green h-[2.5rem]"
            );
            setRightStyle(
              "w-[5rem] text-center duration-500 relative text-white h-[2.5rem]"
            );
          }}
        >
          Top
        </button>
      </div>
      <button
        className="bg-white bg-opacity-50 rounded-full py-2 px-5 text-md-dark-green h-[2.5rem]"
        onClick={() => sigListCallback(true)}
      >
        SIGs
      </button>
    </div>
  );
};

export default ButtonTools;

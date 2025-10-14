import { useState } from "react";

type Props = {
  switchCallback: Function;
  sigListCallback: Function;
};

const ButtonTools = ({ switchCallback, sigListCallback }: Props) => {
  const [activeTab, setActiveTab] = useState<"latest" | "top">("latest");

  return (
    <div className="flex flex-row justify-between items-center h-16 mb-2 md:mb-4">
      {/* Toggle Button */}
      <div className="flex bg-white/50 backdrop-blur-sm rounded-full relative select-none w-40">
        <div
          className={`absolute w-20 h-10 bg-md-dark-green rounded-full transition-all duration-500 ${activeTab === "latest" ? "left-0" : "left-20"
            }`}
        />
        <button
          className={`w-20 text-center relative h-10 transition-colors duration-500 text-sm md:text-base ${activeTab === "latest" ? "text-white" : "text-md-dark-green"
            }`}
          onClick={() => {
            setActiveTab("latest");
            switchCallback(1);
          }}
        >
          Latest
        </button>
        <button
          className={`w-20 text-center relative h-10 transition-colors duration-500 text-sm md:text-base ${activeTab === "top" ? "text-white" : "text-md-dark-green"
            }`}
          onClick={() => {
            setActiveTab("top");
            switchCallback(0);
          }}
        >
          Top
        </button>
      </div>

      {/* SIGs Button */}
      <button
        className="bg-white/50 backdrop-blur-sm rounded-full py-2 px-5 md:px-6 text-md-dark-green h-10 hover:bg-white/60 transition-colors text-sm md:text-base"
        onClick={() => sigListCallback(true)}
      >
        SIGs
      </button>
    </div>
  );
};

export default ButtonTools;
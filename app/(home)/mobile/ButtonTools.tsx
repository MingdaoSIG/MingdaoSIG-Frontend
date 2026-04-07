import { useState } from "react";

type Props = {
  switchCallback: (value: number) => void;
  sigListCallback: (value: boolean) => void;
};

const ButtonTools = ({ switchCallback, sigListCallback }: Props) => {
  const [activeTab, setActiveTab] = useState<"latest" | "top">("latest");

  return (
    <div className="mb-2 flex h-16 flex-row items-center justify-between md:mb-4">
      {/* Toggle Button */}
      <div className="relative flex w-40 select-none rounded-full bg-white/50 backdrop-blur-sm">
        <div
          className={`absolute h-10 w-20 rounded-full bg-md-dark-green transition-all duration-500 ${
            activeTab === "latest" ? "left-0" : "left-20"
          }`}
        />
        <button
          type="button"
          className={`relative h-10 w-20 text-center text-sm transition-colors duration-500 md:text-base ${
            activeTab === "latest" ? "text-white" : "text-md-dark-green"
          }`}
          onClick={() => {
            setActiveTab("latest");
            switchCallback(1);
          }}
        >
          Latest
        </button>
        <button
          type="button"
          className={`relative h-10 w-20 text-center text-sm transition-colors duration-500 md:text-base ${
            activeTab === "top" ? "text-white" : "text-md-dark-green"
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
        type="button"
        className="h-10 rounded-full bg-white/50 px-5 py-2 text-md-dark-green text-sm backdrop-blur-sm transition-colors hover:bg-white/60 md:px-6 md:text-base"
        onClick={() => sigListCallback(true)}
      >
        SIGs
      </button>
    </div>
  );
};

export default ButtonTools;

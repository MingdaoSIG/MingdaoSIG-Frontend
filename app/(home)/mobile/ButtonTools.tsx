"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { TapScaleButton } from "@/components/mobile/TapScale";

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
        <motion.div
          className="absolute h-10 w-20 rounded-full bg-md-dark-green"
          animate={{ x: activeTab === "latest" ? 0 : 80 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <TapScaleButton
          type="button"
          className={`relative h-10 w-20 text-center text-sm md:text-base ${
            activeTab === "latest" ? "text-white" : "text-md-dark-green"
          }`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => {
            setActiveTab("latest");
            switchCallback(1);
          }}
        >
          Latest
        </TapScaleButton>
        <TapScaleButton
          type="button"
          className={`relative h-10 w-20 text-center text-sm md:text-base ${
            activeTab === "top" ? "text-white" : "text-md-dark-green"
          }`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => {
            setActiveTab("top");
            switchCallback(0);
          }}
        >
          Top
        </TapScaleButton>
      </div>

      {/* SIGs Button */}
      <TapScaleButton
        type="button"
        className="h-10 rounded-full bg-white/50 px-5 py-2 text-md-dark-green text-sm backdrop-blur-sm hover:bg-white/60 md:px-6 md:text-base"
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => sigListCallback(true)}
      >
        SIGs
      </TapScaleButton>
    </div>
  );
};

export default ButtonTools;

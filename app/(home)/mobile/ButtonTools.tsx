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
      <div className="relative flex w-40 select-none rounded-control border border-line bg-surface p-0.5 shadow-card">
        <motion.div
          className="absolute h-9 w-[4.875rem] rounded-[6px] bg-brand-700"
          animate={{ x: activeTab === "latest" ? 0 : 78 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <TapScaleButton
          type="button"
          className={`relative h-9 w-[4.875rem] text-center font-semibold text-sm md:text-base ${
            activeTab === "latest" ? "text-white" : "text-ink-700"
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
          className={`relative h-9 w-[4.875rem] text-center font-semibold text-sm md:text-base ${
            activeTab === "top" ? "text-white" : "text-ink-700"
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
        className="h-10 rounded-control border border-line bg-surface px-5 py-2 font-semibold text-ink-700 text-sm shadow-card md:px-6 md:text-base"
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

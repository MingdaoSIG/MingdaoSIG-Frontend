"use client";

import { motion } from "motion/react";

import { TapScaleButton } from "@/components/mobile/TapScale";
import type { HomeFeed } from "../useHomeFeed";

type Props = {
  value: HomeFeed;
  onChange: (value: HomeFeed) => void;
  /** 「我的 SIG」 is offered to logged-in users only. */
  showMySig: boolean;
  sigListCallback: (value: boolean) => void;
};

/** Width of one tab in px (4.875rem); the indicator slides by this. */
const TAB_WIDTH = 78;

const ButtonTools = ({
  value,
  onChange,
  showMySig,
  sigListCallback,
}: Props) => {
  const tabs: { value: HomeFeed; label: string }[] = [
    { value: "latest", label: "最新" },
    { value: "top", label: "熱門" },
    ...(showMySig ? [{ value: "mysig" as const, label: "我的 SIG" }] : []),
  ];
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === value),
  );

  return (
    <div className="mb-2 flex h-16 flex-row items-center justify-between md:mb-4">
      {/* Toggle Button */}
      <div
        className={`relative flex select-none rounded-control border border-line bg-surface p-0.5 shadow-card ${
          showMySig ? "w-[14.875rem]" : "w-40"
        }`}
      >
        <motion.div
          className="absolute h-11 w-[4.875rem] rounded-[6px] bg-brand-700"
          animate={{ x: activeIndex * TAB_WIDTH }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <TapScaleButton
              key={tab.value}
              type="button"
              className={`relative h-11 w-[4.875rem] whitespace-nowrap text-center font-semibold text-sm md:text-base ${
                active ? "text-white" : "text-ink-700"
              }`}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              aria-pressed={active}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
            </TapScaleButton>
          );
        })}
      </div>

      {/* SIGs Button */}
      <TapScaleButton
        type="button"
        className="h-11 rounded-control border border-line bg-surface px-5 py-2 font-semibold text-ink-700 text-sm shadow-card md:px-6 md:text-base"
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => sigListCallback(true)}
      >
        SIG
      </TapScaleButton>
    </div>
  );
};

export default ButtonTools;

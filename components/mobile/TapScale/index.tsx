"use client";

import { motion } from "motion/react";
import Link from "next/link";

export const TapScale = motion.div;
export const TapScaleButton = motion.button;
export const TapScaleLink = motion.create(Link);

export const defaultTapAnimation = {
  whileTap: { scale: 0.94 },
  transition: { type: "spring" as const, stiffness: 400, damping: 30 },
};

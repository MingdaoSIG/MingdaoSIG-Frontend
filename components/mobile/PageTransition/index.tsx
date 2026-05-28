"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useNavDirection } from "@/utils/useNavDirection";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const direction = useNavDirection();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction * 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -direction * 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;

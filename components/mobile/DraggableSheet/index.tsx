"use client";

import { type HTMLMotionProps, motion, type PanInfo } from "motion/react";
import type { ReactNode } from "react";

type DraggableSheetProps = Omit<HTMLMotionProps<"div">, "onDragEnd"> & {
  onDismiss: () => void;
  dismissOffset?: number;
  dismissVelocity?: number;
  children: ReactNode;
};

export function DraggableSheet({
  onDismiss,
  dismissOffset = 80,
  dismissVelocity = 500,
  children,
  ...rest
}: DraggableSheetProps) {
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > dismissOffset || info.velocity.y > dismissVelocity) {
      onDismiss();
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default DraggableSheet;

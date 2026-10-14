"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  type ReactNode,
  type TouchEvent,
  useCallback,
  useRef,
  useState,
} from "react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
  children,
  className,
}: PullToRefreshProps) {
  const pull = useMotionValue(0);
  const rotation = useTransform(pull, [0, threshold], [0, 180]);
  const indicatorOpacity = useTransform(pull, [0, threshold / 2], [0, 1]);
  const contentOpacity = useTransform(pull, [0, threshold], [1, 0.85]);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAtTop = useCallback(() => {
    const el = containerRef.current;
    return el ? el.scrollTop <= 0 : false;
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing) {
        return;
      }
      if (!isAtTop()) {
        return;
      }
      startYRef.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing, isAtTop],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (startYRef.current === null) {
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pull.set(0);
        return;
      }
      const dampened = Math.min(delta * 0.5, threshold * 1.5);
      pull.set(dampened);
    },
    [pull, threshold],
  );

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null) {
      return;
    }
    const final = pull.get();
    startYRef.current = null;

    if (final >= threshold) {
      setIsRefreshing(true);
      pull.set(threshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pull.set(0);
      }
    } else {
      pull.set(0);
    }
  }, [pull, threshold, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ overscrollBehavior: "contain" }}
    >
      <AnimatePresence>
        {(pull.get() > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              pointerEvents: "none",
              opacity: indicatorOpacity,
            }}
          >
            <motion.div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid rgba(0, 76, 100, 0.2)",
                borderTopColor: "#004c64",
                rotate: isRefreshing ? undefined : rotation,
              }}
              animate={isRefreshing ? { rotate: 360 } : undefined}
              transition={
                isRefreshing
                  ? {
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1,
                      ease: "linear",
                    }
                  : undefined
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div style={{ y: pull, opacity: contentOpacity }}>
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavDirection = -1 | 0 | 1;

export function useNavDirection(): NavDirection {
  const pathname = usePathname();
  const stackRef = useRef<string[]>([]);
  const [direction, setDirection] = useState<NavDirection>(0);

  useEffect(() => {
    const stack = stackRef.current;

    if (stack.length === 0) {
      stack.push(pathname);
      return;
    }

    if (stack[stack.length - 1] === pathname) {
      return;
    }

    if (stack.length >= 2 && stack[stack.length - 2] === pathname) {
      stack.pop();
      setDirection(-1);
      return;
    }

    stack.push(pathname);
    setDirection(1);
  }, [pathname]);

  return direction;
}

export default useNavDirection;

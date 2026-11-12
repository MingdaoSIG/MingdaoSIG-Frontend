"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { type ReactNode, useState } from "react";
import { PwaSetup } from "@/components/Pwa/PwaSetup";
import { ApiError } from "@/modules/api/client";
import { AuthProvider } from "@/utils/useUserAccount/AuthProvider";

/** Retry once for network trouble or 5xx; never hammer a 4xx or a 429. */
function shouldRetry(failureCount: number, error: Error) {
  if (failureCount >= 1) {
    return false;
  }
  if (error instanceof ApiError) {
    return error.kind === "network" || error.kind === "invalid-response";
  }
  return true;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: shouldRetry,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PwaSetup />
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";

import type { Sig } from "@/interfaces/Sig";
import { apiRequest } from "@/modules/api/client";

/** A SIG, or null when it cannot be loaded. */
export const useSig = (sigId: string | undefined) => {
  return useQuery<Sig | null, Error>({
    queryKey: ["sig", sigId],
    queryFn: async ({ signal }) => {
      if (!sigId) {
        return null;
      }
      const result = await apiRequest<Sig>(`/sig/${sigId}`, { signal });
      return result.ok && result.data && typeof result.data === "object"
        ? result.data
        : null;
    },
    enabled: Boolean(sigId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useSig;

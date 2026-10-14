"use client";

import { useQuery } from "@tanstack/react-query";

import type { Sig } from "@/interfaces/Sig";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useSig = (sigId: string | undefined) => {
  return useQuery<Sig | null, Error>({
    queryKey: ["sig", sigId],
    queryFn: async () => {
      if (!sigId) {
        return null;
      }
      const response = await fetch(`${API_URL}/sig/${sigId}`, {
        method: "GET",
      });
      if (!response.ok) {
        return null;
      }
      const responseData = await response.json();
      return (responseData?.data as Sig) ?? null;
    },
    enabled: Boolean(sigId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useSig;

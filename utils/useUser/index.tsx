"use client";

import { useQuery } from "@tanstack/react-query";

import type { User } from "@/interfaces/User";
import { apiRequest } from "@/modules/api/client";

/** Public profile of a user, or null when it cannot be loaded. */
export const useUser = (userId: string | undefined) => {
  return useQuery<User | null, Error>({
    queryKey: ["user", userId],
    queryFn: async ({ signal }) => {
      if (!userId) {
        return null;
      }
      const result = await apiRequest<User>(`/user/${userId}`, { signal });
      return result.ok && result.data && typeof result.data === "object"
        ? result.data
        : null;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useUser;

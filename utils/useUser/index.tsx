"use client";

import { useQuery } from "@tanstack/react-query";

import type { User } from "@/interfaces/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useUser = (userId: string | undefined) => {
  return useQuery<User | null, Error>({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "GET",
      });
      if (!response.ok) {
        return null;
      }
      const responseData = await response.json();
      return (responseData?.data as User) ?? null;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useUser;

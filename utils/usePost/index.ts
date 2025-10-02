import type { TThread } from "@/interfaces/Thread";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

type PostQuery = {
  pageSize: number;
  sort?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useAllPost = (query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["allPost"] });
  }, []);

  return useInfiniteQuery<TThread[], Error>({
    queryKey: ["allPost", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `${API_URL}/post/list?` +
          new URLSearchParams({
            skip: String(
              (Number(pageParam) === 0 ? 0 : Number(pageParam) - 1) *
                query.pageSize,
            ),
            limit: String(query.pageSize),
            sort: query.sort ? String(query.sort) : "latest",
          }),
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      return responseData.data as TThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useUserPost = (userId: string, query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["userPost"] });
  }, []);

  return useInfiniteQuery<TThread[], Error>({
    queryKey: ["userPost", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `${API_URL}/post/list/user/${userId}?` +
          new URLSearchParams({
            skip: String(
              (Number(pageParam) === 0 ? 0 : Number(pageParam) - 1) *
                query.pageSize,
            ),
            limit: String(query.pageSize),
            sort: query.sort ? String(query.sort) : "latest",
          }),
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      return responseData.data as TThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useSigPost = (sigId: string, query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["sigPost"] });
  }, []);

  return useInfiniteQuery<TThread[], Error>({
    queryKey: ["sigPost", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `${API_URL}/post/list/sig/${sigId}?` +
          new URLSearchParams({
            skip: String(
              (Number(pageParam) === 0 ? 0 : Number(pageParam) - 1) *
                query.pageSize,
            ),
            limit: String(query.pageSize),
            sort: query.sort ? String(query.sort) : "latest",
          }),
        {
          method: "GET",
        },
      );

      const responseData = await response.json();
      return responseData.data as TThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useTopPost = (query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["topPost"] });
  }, []);

  return useInfiniteQuery<TThread[], Error>({
    queryKey: ["topPost", query],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/post/list?skip=0&limit=${String(Number(query.pageSize))}`,
        {
          method: "GET",
        },
      );
      const responseData = await response.json();
      return responseData.data as TThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

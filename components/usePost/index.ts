import { IThread } from "@/interfaces/Thread.interface";
import { useInfiniteQuery } from "@tanstack/react-query";


type PostQuery = {
  pageSize: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useAllPost = (query: PostQuery) => {
  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["posts", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`${API_URL}/post/list?` + new URLSearchParams({
        skip: String(Number(pageParam) * query.pageSize),
        limit: String(query.pageSize),
      }), {
        method: "GET",
      });

      const responseData = await response.json();
      return responseData.data as IThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useUserPost = (userId: string, query: PostQuery) => {
  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["posts", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`${API_URL}/post/list/user/${userId}?` + new URLSearchParams({
        skip: String(Number(pageParam) * query.pageSize),
        limit: String(query.pageSize),
      }), {
        method: "GET",
      });

      const responseData = await response.json();
      return responseData.data as IThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useSigPost = (userId: string, query: PostQuery) => {
  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["posts", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`${API_URL}/post/list/sig/${userId}?` + new URLSearchParams({
        skip: String(Number(pageParam) * query.pageSize),
        limit: String(query.pageSize),
      }), {
        method: "GET",
      });

      const responseData = await response.json();
      return responseData.data as IThread[];
    },
    staleTime: 1 * 60 * 1000,
    getNextPageParam: (lastPage = [], allPages) => {
      return lastPage.length > 0 ? allPages.length + 1 : undefined;
    },
    initialPageParam: 0,
  });
};
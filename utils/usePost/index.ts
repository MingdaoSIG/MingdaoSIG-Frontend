import Post from "@/app/post/[postID]/page";
import { IThread } from "@/interfaces/Thread.interface";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";


type PostQuery = {
  pageSize: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useAllPost = (query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["allPost"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["allPost", query],
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
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["userPost"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["userPost", query],
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

export const useSigPost = (sigId: string, query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["sigPost"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["sigPost", query],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`${API_URL}/post/list/sig/${sigId}?` + new URLSearchParams({
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

export const useTopPost = (query: PostQuery) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["topPost"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useInfiniteQuery<IThread[], Error>({
    queryKey: ["topPost", query],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/post/list?skip=0&limit=${String(Number(query.pageSize))}`,
        {
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
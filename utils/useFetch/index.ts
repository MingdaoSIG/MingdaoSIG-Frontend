import { useEffect, useRef, useState } from "react";

type StandardResponse<T> = {
  status: number;
  data: T;
};

interface State<T> {
  data?: T;
  error?: Error;
  isLoading: boolean;
}

// A custom hook that fetches data from a URL with AbortController to prevent memory leaks
export function useFetch<T>(url: string, options?: RequestInit): State<T> {
  const [state, setState] = useState<State<T>>({
    data: undefined,
    error: undefined,
    isLoading: true,
  });

  // 使用 ref 追蹤組件是否已卸載
  const isMounted = useRef(true);

  useEffect(() => {
    // 創建 AbortController 用於取消請求
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        // 重置狀態當 URL 變化時
        if (isMounted.current) {
          setState({ data: undefined, error: undefined, isLoading: true });
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
          ...options,
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(res.statusText);
        }

        const response = (await res.json()) as StandardResponse<T>;

        // 只有在組件仍然掛載時才更新狀態
        if (isMounted.current) {
          setState({ data: response.data, isLoading: false, error: undefined });
        }
      } catch (error: any) {
        // 忽略 AbortError（這是正常的取消行為）
        if (error.name === "AbortError") {
          return;
        }

        // 只有在組件仍然掛載時才更新錯誤狀態
        if (isMounted.current) {
          setState({ error, isLoading: false });
        }
      }
    };

    fetchData();

    // 清理函數：取消請求並標記組件已卸載
    return () => {
      controller.abort();
    };
  }, [url, options]);

  // 組件卸載時標記
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return state;
}

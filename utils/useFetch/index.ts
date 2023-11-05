import { useState, useEffect } from "react";

type StandardResponse<T> = {
  status: number;
  data: T;
};

interface State<T> {
  data?: T;
  error?: Error;
  isLoading: boolean;
}

// A custom hook that fetches data from a URL
// eslint-disable-next-line no-undef
export function useFetch<T>(
  url: string,
  // eslint-disable-next-line no-undef
  options?: RequestInit
): State<T> {
  const [state, setState] = useState<State<T>>({
    data: undefined,
    error: undefined,
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}${url}`,
          options
        );
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        const response = (await res.json()) as StandardResponse<T>;
        setState({ data: response.data, isLoading: false });
      } catch (error: any) {
        setState({ error, isLoading: false });
      }
    };

    fetchData();
  }, [url]);

  return state;
}

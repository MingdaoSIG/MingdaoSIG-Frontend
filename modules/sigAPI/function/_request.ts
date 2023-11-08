import { LimitedRequestInit, PaginationQuery, ParsedPaginationQuery } from "@/interfaces/Request";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const baseUrlMap = {
  "default": API_BASE_URL,
  "dev": "http://localhost:3001"
};

async function get(
  baseUrlType: "default" | "dev",
  path: string,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOption?: LimitedRequestInit;
  }
) {
  let baseUrl = baseUrlMap[baseUrlType];

  let parsedQuery: ParsedPaginationQuery | "" = "";
  if (option?.requestQuery) {
    parsedQuery = {
      skip: String(option.requestQuery.skip),
      limit: String(option.requestQuery.limit)
    };
  }

  const response = await (
    await fetch(
      baseUrl + path + new URLSearchParams(parsedQuery),
      {
        ...option?.requestOption,
        method: "GET",
        headers: {
          "Authorization": option?.token ? `Bearer ${option.token}` : "",
          "Content-Type": "application/json",
        }
      })
  ).json();

  if (response.status !== 2000) throw new Error(response.status);
  if (!response.data) throw new Error("Unexpected response");

  return response.data;
}

async function post(
  baseUrlType: "default",
  path: string,
  body?: object,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOptions?: LimitedRequestInit;
  }
) {
  let baseUrl = baseUrlMap[baseUrlType];

  let parsedQuery: ParsedPaginationQuery | "" = "";
  if (option?.requestQuery) {
    parsedQuery = {
      skip: String(option.requestQuery.skip),
      limit: String(option.requestQuery.limit)
    };
  }

  const response = await (
    await fetch(
      baseUrl + path + new URLSearchParams(parsedQuery),
      {
        ...option?.requestOptions,
        method: "POST",
        headers: {
          "Authorization": option?.token ? `Bearer ${option.token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
  ).json();

  if (response.status !== 2000) throw new Error(response.status);
  if (!response.data) throw new Error("Unexpected response");

  return response.data;
}

const request = {
  get,
  post
};
export default request;
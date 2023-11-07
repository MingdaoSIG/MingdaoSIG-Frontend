import { LimitedRequestInit, PaginationQuery, ParsedPaginationQuery } from "@/interfaces/Request";

async function get(
  url: string,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOption?: LimitedRequestInit;
  }
) {
  let parsedQuery: ParsedPaginationQuery | "" = "";
  if (option?.requestQuery) {
    parsedQuery = {
      skip: String(option.requestQuery.skip),
      limit: String(option.requestQuery.limit)
    };
  }

  const response = await (
    await fetch(
      url + new URLSearchParams(parsedQuery),
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
  url: string,
  body?: object,
  option?: {
    token?: string;
    requestQuery?: PaginationQuery;
    requestOptions?: LimitedRequestInit;
  }
) {
  let parsedQuery: ParsedPaginationQuery | "" = "";
  if (option?.requestQuery) {
    parsedQuery = {
      skip: String(option.requestQuery.skip),
      limit: String(option.requestQuery.limit)
    };
  }

  const response = await (
    await fetch(
      url + new URLSearchParams(parsedQuery),
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
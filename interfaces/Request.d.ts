export interface RequestInit {
  body?: BodyInit | null;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: HeaderInit;
  integrity?: string;
  keepalive?: boolean;
  method?: Method;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: any;
}

export interface LimitedRequestInit {
  cache?: RequestCache;
  credentials?: RequestCredentials;
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  signal?: AbortSignal | null;
  window?: any;
}

export type BodyInit =
  | Blob
  | BufferSource
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | string;
export type BufferSource =
  | ArrayBufferView
  | ArrayBuffer;

export type RequestCache =
  | "default"
  | "no-store"
  | "reload"
  | "no-cache"
  | "force-cache"
  | "only-if-cached";

export type RequestCredentials =
  | "omit"
  | "same-origin"
  | "include";

export type HeaderInit =
  | Headers
  | string[][]
  | Record<string, string>;

export type Method =
  | "GET"
  | "DELETE"
  | "HEAD"
  | "OPTIONS"
  | "POST"
  | "PUT"
  | "PATCH"
  | "PURGE"
  | "LINK"
  | "UNLINK";

export type RequestMode =
  | "navigate"
  | "same-origin"
  | "no-cors"
  | "cors";

export type RequestRedirect =
  | "error"
  | "follow"
  | "manual";

export type ReferrerPolicy =
  | ""
  | "same-origin"
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

export interface PaginationQuery {
  [skip: string]: number;
  [limit: string]: number;
}

export interface ParsedPaginationQuery {
  [skip: string]: string;
  [limit: string]: string;
}
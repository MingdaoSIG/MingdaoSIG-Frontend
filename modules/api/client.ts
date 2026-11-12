import { CustomStatus } from "@/modules/customStatusCode";

// One place that talks to the backend. It never throws: every outcome
// (success, non-2000 status, 429 plain text, 502 HTML, network failure)
// comes back as an ApiResult, and the caller decides what to show.
//
// Backend responses are `{ status, data }` where status 2000 means OK.
// Errors are often HTTP 4xx/5xx with a JSON body, and rate limits may
// still arrive as plain text ("Too many requests...").

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const NOT_FOUND_STATUSES: number[] = [
  CustomStatus.NOT_FOUND,
  CustomStatus.INVALID_USER_ID,
  CustomStatus.INVALID_POST_ID,
  CustomStatus.INVALID_SIG_ID,
];

export type ApiFailureKind =
  | "rate-limited"
  | "unauthorized"
  | "too-large"
  | "not-found"
  | "network"
  | "aborted"
  | "invalid-response"
  | "error";

export type ApiSuccess<T> = {
  ok: true;
  status: number;
  httpStatus: number;
  data: T;
  body: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  kind: ApiFailureKind;
  /** Backend custom status, or null when the body was not JSON. */
  status: number | null;
  httpStatus: number;
  /** Message for the user, in Traditional Chinese. */
  message: string;
  body: unknown;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  readonly kind: ApiFailureKind;
  readonly status: number | null;
  readonly httpStatus: number;

  constructor(failure: ApiFailure) {
    super(failure.message);
    this.name = "ApiError";
    this.kind = failure.kind;
    this.status = failure.status;
    this.httpStatus = failure.httpStatus;
  }
}

type AuthHandlers = {
  getToken: () => string | null;
  /** Re-exchange after `failedToken` was rejected; null when that failed. */
  refreshToken: (failedToken: string) => Promise<string | null>;
};

let authHandlers: AuthHandlers | null = null;

/** Called by the auth provider so requests can refresh an expired token. */
export function registerAuthHandlers(handlers: AuthHandlers | null) {
  authHandlers = handlers;
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** JSON-encoded unless it is FormData, URLSearchParams, Blob or a string. */
  body?: unknown;
  /** Explicit platform token. */
  token?: string | null;
  /** Attach the signed-in user's token when no explicit token is given. */
  auth?: boolean;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

/**
 * Sends a request and classifies the outcome. Authenticated requests that
 * come back 401 / 4013 get one token re-exchange and one retry.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const token =
    options.token || (options.auth ? (authHandlers?.getToken() ?? null) : null);

  const result = await send<T>(path, options, token);

  if (
    token &&
    !result.ok &&
    result.kind === "unauthorized" &&
    authHandlers &&
    !options.signal?.aborted
  ) {
    const fresh = await authHandlers.refreshToken(token);
    if (fresh && fresh !== token) {
      return send<T>(path, options, fresh);
    }
  }
  return result;
}

/** Like apiRequest, but returns `data` or throws an ApiError. */
export async function fetchApiData<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const result = await apiRequest<T>(path, options);
  if (!result.ok) {
    throw new ApiError(result);
  }
  return result.data;
}

/** User-facing message for anything thrown by an API call. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return describeFailure("error");
}

export function isRateLimited(result: ApiResult<unknown>): boolean {
  return !result.ok && result.kind === "rate-limited";
}

export function describeFailure(kind: ApiFailureKind): string {
  switch (kind) {
    case "rate-limited":
      return "操作太頻繁，請稍後再試";
    case "unauthorized":
      return "登入已過期，請重新登入後再試";
    case "too-large":
      return "內容太大，請縮小後再試";
    case "not-found":
      return "找不到這筆資料";
    case "network":
      return "網路連線失敗，請檢查網路後再試";
    case "aborted":
      return "已取消";
    case "invalid-response":
      return "伺服器暫時無法回應，請稍後再試";
    default:
      return "發生錯誤，請稍後再試";
  }
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const url = `${API_URL}${path}`;
  if (!query) {
    return url;
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

function isRawBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    (typeof FormData !== "undefined" && body instanceof FormData) ||
    (typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams) ||
    (typeof Blob !== "undefined" && body instanceof Blob)
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(
  kind: ApiFailureKind,
  status: number | null,
  httpStatus: number,
  body: unknown,
): ApiFailure {
  return {
    ok: false,
    kind,
    status,
    httpStatus,
    message: describeFailure(kind),
    body,
  };
}

function classify(
  status: number | null,
  httpStatus: number,
  parsed: unknown,
  text: string,
): ApiFailureKind {
  if (
    httpStatus === 429 ||
    status === CustomStatus.TOO_MANY_REQUESTS ||
    /too many requests/i.test(text)
  ) {
    return "rate-limited";
  }
  if (httpStatus === 401 || status === CustomStatus.INVALID_JWT) {
    return "unauthorized";
  }
  if (httpStatus === 413 || status === CustomStatus.CONTENT_SIZE_EXCEEDED) {
    return "too-large";
  }
  if (status !== null && NOT_FOUND_STATUSES.includes(status)) {
    return "not-found";
  }
  if (!isRecord(parsed)) {
    return "invalid-response";
  }
  return "error";
}

async function send<T>(
  path: string,
  options: ApiRequestOptions,
  token: string | null,
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (isRawBody(options.body)) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  let text = "";
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    });
    text = await response.text();
  } catch (error) {
    return failure(isAbortError(error) ? "aborted" : "network", null, 0, null);
  }

  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  const status =
    isRecord(parsed) && typeof parsed.status === "number"
      ? parsed.status
      : null;

  if (status === CustomStatus.OK && isRecord(parsed)) {
    return {
      ok: true,
      status,
      httpStatus: response.status,
      data: parsed.data as T,
      body: parsed,
    };
  }

  return failure(
    classify(status, response.status, parsed, text),
    status,
    response.status,
    parsed ?? text,
  );
}

import type { QueryClient } from "@tanstack/react-query";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import { type ApiResult, apiRequest } from "@/modules/api/client";
import { isValidCustomId } from "@/modules/validation";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";

// `/@<id>` is a user or a SIG. The cached SIG list (`/sig/list`, which
// also carries old ids) says which to ask for, so the page makes one
// request instead of two and never logs a 404 for the other kind. The
// other lookup runs only when the first one finds nothing (the
// announcement SIG, for one, is not in the list).

export type AccountKind = "user" | "sig";

export type AccountLookup = {
  data: User | Sig | null;
  dataType: AccountKind | null;
  /** Set when the lookup failed for a reason other than "not found". */
  error: string | null;
  /** The id matched an old customId: the current one (contract v4 §3.7). */
  redirectTo?: string;
};

function isAccount(value: unknown): value is User | Sig {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as User)._id === "string"
  );
}

async function sigDirectory(client: QueryClient): Promise<Sig[]> {
  try {
    return await client.fetchQuery<Sig[]>({
      queryKey: SIG_LIST_QUERY_KEY,
      queryFn: async ({ signal }) => {
        const result = await apiRequest<Sig[]>("/sig/list", { signal });
        return result.ok && Array.isArray(result.data) ? result.data : [];
      },
      staleTime: 60 * 1000,
    });
  } catch {
    return [];
  }
}

/** Which kind to ask for first, from the SIG list. */
export function guessKind(accountId: string, sigs: Sig[]): AccountKind {
  const id = accountId.replace(/^@/, "").toLowerCase();
  const isSig = sigs.some(
    (sig) =>
      sig.customId?.toLowerCase() === id ||
      sig.previousCustomIds?.some((old) => old.toLowerCase() === id),
  );
  return isSig ? "sig" : "user";
}

export async function lookupAccount(
  accountId: string,
  client: QueryClient,
  signal: AbortSignal,
): Promise<AccountLookup> {
  const first = guessKind(accountId, await sigDirectory(client));
  const order: AccountKind[] =
    first === "sig" ? ["sig", "user"] : ["user", "sig"];
  const currentId = accountId.replace(/^@/, "");
  let failure: string | null = null;

  for (const kind of order) {
    // accountId is validated (`@` + [a-z0-9_.-]), so it is safe in the
    // path; it must not be encoded, or `/user/@:id` stops matching.
    const result: ApiResult<User | Sig> = await apiRequest<User | Sig>(
      `/${kind}/${accountId}`,
      { signal },
    );
    if (signal.aborted) {
      return { data: null, dataType: null, error: null };
    }
    if (result.ok && isAccount(result.data)) {
      const next = result.data.redirectTo;
      const redirectTo =
        typeof next === "string" &&
        next !== currentId &&
        isValidCustomId(`@${next}`)
          ? next
          : undefined;
      return { data: result.data, dataType: kind, error: null, redirectTo };
    }
    if (!result.ok && result.kind !== "not-found") {
      failure = result.message;
      break;
    }
  }
  return { data: null, dataType: null, error: failure };
}

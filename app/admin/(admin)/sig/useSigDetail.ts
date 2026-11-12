"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import sigAPI from "@/modules/sigAPI";
import { getData, isObjectId, useAdminSigs } from "../api";
import { useAdmin } from "../context";
import { useArchivedSigs } from "../sigAdminApi";
import type { AdminSig, UserRef } from "../types";

// One SIG for its admin page. It comes from GET /admin/sigs (admins get
// every SIG, managers their own). Archived SIGs, and the announcement SIG
// (stored as removed), are in GET /admin/sigs?archived=1 for admins; the
// last resort is GET /sig/:id.

function toRef(user: User | null, id: string): UserRef {
  return {
    _id: id,
    name: user?.name ?? "",
    customId: user?.customId ?? "",
    avatar: user?.avatar ?? "",
  };
}

async function loadFallback(sigId: string, signal: AbortSignal) {
  const sig = await getData<Sig>(`/sig/${sigId}`, undefined, signal);
  const resolve = async (ids: string[] = []) => {
    const unique = Array.from(new Set(ids));
    const results = await Promise.allSettled(
      unique.map((id) => sigAPI.getUserData(id, signal) as Promise<User>),
    );
    return unique.map((id, index) => {
      const result = results[index];
      return toRef(result.status === "fulfilled" ? result.value : null, id);
    });
  };
  const [leaders, moderators] = await Promise.all([
    resolve(sig.leader),
    resolve(sig.moderator),
  ]);
  const detail: AdminSig = {
    _id: sig._id,
    name: sig.name,
    customId: sig.customId,
    avatar: sig.avatar,
    description: sig.description,
    color: sig.color,
    defaultCover: sig.defaultCover,
    previousCustomIds: sig.previousCustomIds,
    archived: Boolean(sig.removed),
    leaders,
    moderators,
  };
  return detail;
}

export function useSigDetail(sigId: string) {
  const admin = useAdmin();
  const list = useAdminSigs();
  const fromActive = list.data?.find((sig) => sig._id === sigId);
  const lookArchived = admin.isAdmin && list.isSuccess && !fromActive;
  const archived = useArchivedSigs(lookArchived);
  const fromArchived = lookArchived
    ? archived.data?.find((sig) => sig._id === sigId)
    : undefined;
  const fromList = fromActive ?? fromArchived;
  const needFallback =
    lookArchived && !archived.isPending && !fromArchived && isObjectId(sigId);
  const fallback = useQuery({
    queryKey: ["admin", "sigs", "fallback", sigId],
    queryFn: ({ signal }) => loadFallback(sigId, signal),
    enabled: needFallback,
  });

  const sig = fromList ?? (needFallback ? fallback.data : undefined);
  const isPending =
    list.isPending ||
    (lookArchived && archived.isPending) ||
    (needFallback && fallback.isPending);
  const error = list.error ?? (needFallback ? fallback.error : null);
  return {
    sig,
    isPending,
    error,
    notFound: !isPending && !error && !sig,
    refetch: () => {
      void list.refetch();
      if (lookArchived) {
        void archived.refetch();
      }
      if (needFallback) {
        void fallback.refetch();
      }
    },
  };
}

/**
 * Email and student number of the leaders and 指導老師, from their full
 * profiles. Only admins may read those; managers see names only.
 */
export function useStaffDetails(people: UserRef[], enabled: boolean) {
  const admin = useAdmin();
  const token = admin.token;
  const results = useQueries({
    queries: people.map((person) => ({
      queryKey: ["admin", "users", "full", person._id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        sigAPI.getFullUserData(person._id, token ?? "", signal),
      enabled: enabled && Boolean(token),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const details = new Map<string, User>();
  for (const [index, person] of people.entries()) {
    const data = results[index]?.data;
    if (data) {
      details.set(person._id, data);
    }
  }
  return details;
}

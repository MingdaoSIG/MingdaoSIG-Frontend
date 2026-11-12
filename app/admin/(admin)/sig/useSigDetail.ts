"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import type { Sig } from "@/interfaces/Sig";
import type { User } from "@/interfaces/User";
import sigAPI from "@/modules/sigAPI";
import { getData, isObjectId, useAdminSigs } from "../api";
import { useAdmin } from "../context";
import type { AdminSig, UserRef } from "../types";

// One SIG for its admin page. It comes from GET /admin/sigs (admins get
// every SIG, managers their own). The announcement SIG is stored as
// removed and is not in that list, so admins fall back to GET /sig/:id.

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
    leaders,
    moderators,
  };
  return detail;
}

export function useSigDetail(sigId: string) {
  const admin = useAdmin();
  const list = useAdminSigs();
  const fromList = list.data?.find((sig) => sig._id === sigId);
  const needFallback =
    admin.isAdmin && list.isSuccess && !fromList && isObjectId(sigId);
  const fallback = useQuery({
    queryKey: ["admin", "sigs", "fallback", sigId],
    queryFn: ({ signal }) => loadFallback(sigId, signal),
    enabled: needFallback,
  });

  const sig = fromList ?? (needFallback ? fallback.data : undefined);
  const isPending = list.isPending || (needFallback && fallback.isPending);
  const error = list.error ?? (needFallback ? fallback.error : null);
  return {
    sig,
    isPending,
    error,
    notFound: !isPending && !error && !sig,
    refetch: () => {
      void list.refetch();
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

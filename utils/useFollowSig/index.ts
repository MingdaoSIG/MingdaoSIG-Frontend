"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { Sig } from "@/interfaces/Sig";
import { type ApiResult, apiRequest } from "@/modules/api/client";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import { useUserAccount } from "@/utils/useUserAccount";

// Follow / unfollow a SIG (contract v4 §6.1). Following is not joining:
// a followed SIG feeds the home 「我的 SIG」 tab and the side rail. The
// signed-in profile's `followedSigs` and the SIG list's `followerCount`
// are updated from the answer, so every view agrees without a refetch.

export type FollowAnswer = { followed: boolean; followers: number };

export function followSig(
  sigId: string,
  follow: boolean,
): Promise<ApiResult<FollowAnswer>> {
  return apiRequest<FollowAnswer>(`/sig/${encodeURIComponent(sigId)}/follow`, {
    method: follow ? "POST" : "DELETE",
    auth: true,
  });
}

export function useFollowSig() {
  const { userData, updateUser } = useUserAccount();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const followed = new Set(userData?.followedSigs ?? []);

  const toggle = useCallback(
    async (sigId: string, follow: boolean) => {
      setBusy(sigId);
      const result = await followSig(sigId, follow);
      setBusy(null);
      if (!result.ok) {
        return result;
      }
      updateUser((user) => {
        const set = new Set(user.followedSigs ?? []);
        if (result.data.followed) {
          set.add(sigId);
        } else {
          set.delete(sigId);
        }
        return { ...user, followedSigs: [...set] };
      });
      queryClient.setQueryData<Sig[]>(SIG_LIST_QUERY_KEY, (old) =>
        old?.map((sig) =>
          sig._id === sigId
            ? { ...sig, followerCount: result.data.followers }
            : sig,
        ),
      );
      return result;
    },
    [updateUser, queryClient],
  );

  return {
    isFollowing: (sigId: string) => followed.has(sigId),
    busy,
    toggle,
  };
}

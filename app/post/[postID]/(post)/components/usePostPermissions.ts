"use client";

import { useQuery } from "@tanstack/react-query";

import { announcementSigId } from "@/components/Threads/configs/announcement";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { apiRequest } from "@/modules/api/client";
import useSig from "@/utils/useSig";
import { useUserAccount } from "@/utils/useUserAccount";

const ADMIN_PERMISSION = 2;

function idOf(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return (value as User | Sig | null)?._id;
}

/** Every SIG (the list skips removed ones, such as 公告). */
async function fetchSigs(signal: AbortSignal): Promise<Sig[]> {
  const [list, announcement] = await Promise.all([
    apiRequest<Sig[]>("/sig/list", { signal }),
    apiRequest<Sig>(`/sig/${announcementSigId}`, { signal }),
  ]);
  const sigs = list.ok && Array.isArray(list.data) ? list.data : [];
  if (announcement.ok && announcement.data?._id) {
    sigs.push(announcement.data);
  }
  return sigs;
}

/**
 * What the signed-in user may do to a post. Mirrors the backend
 * (MingdaoSIG-Backend `_server/controller/cloud/post`):
 * - edit: the author or an admin.
 * - delete: the author, a leader of the post's SIG, a moderator (指導老師)
 *   of any SIG, or an admin.
 *
 * The post's SIG comes from the cache the post page already fills; the
 * SIG list is only loaded when the moderator rule is the one left to check.
 */
export function usePostPermissions(post: TThread) {
  const { isLogin, userData } = useUserAccount();
  const userId = isLogin ? userData?._id : undefined;
  const isAdmin = Boolean(userId) && userData?.permission === ADMIN_PERMISSION;
  const isAuthor = Boolean(userId) && idOf(post.user) === userId;

  const { data: sig } = useSig(idOf(post.sig));
  const isLeader = Boolean(userId && sig?.leader?.includes(userId));

  const needSigList = Boolean(userId) && !isAdmin && !isAuthor && !isLeader;
  const { data: sigs } = useQuery<Sig[], Error>({
    queryKey: ["sigs", "all"],
    queryFn: ({ signal }) => fetchSigs(signal),
    enabled: needSigList,
    staleTime: 5 * 60 * 1000,
  });
  const isModerator = Boolean(
    userId &&
      [...(sigs ?? []), ...(sig ? [sig] : [])].some((item) =>
        item.moderator?.includes(userId),
      ),
  );

  return {
    canEdit: isAuthor || isAdmin,
    canDelete: isAuthor || isAdmin || isLeader || isModerator,
  };
}

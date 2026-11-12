import Swal from "sweetalert2";

import { apiRequest } from "@/modules/api/client";

/**
 * Asks before deleting a post, deletes it, and says how it went. Shared by
 * the desktop and mobile post pages. On success the user leaves the post's
 * page (to the home page, or to write a new post); on failure they stay and
 * see why.
 */
export async function confirmDeletePost(
  postId: string | undefined,
  token: string | null,
  navigate: (href: string) => void,
) {
  if (!postId) {
    return;
  }
  const confirm = await Swal.fire({
    title: "確定要刪除這篇貼文嗎？",
    text: "刪除後就無法復原",
    icon: "warning",
    confirmButtonText: "刪除",
    confirmButtonColor: "#b42318",
    showCancelButton: true,
    cancelButtonText: "取消",
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: () =>
      apiRequest(`/post/${postId}`, { method: "DELETE", token }),
  });
  if (!confirm.isConfirmed || !confirm.value) {
    return;
  }
  if (!confirm.value.ok) {
    Swal.fire({
      title: "刪除失敗",
      text: confirm.value.message,
      icon: "error",
      confirmButtonText: "好",
    });
    return;
  }
  const next = await Swal.fire({
    title: "貼文已刪除",
    icon: "success",
    confirmButtonText: "回到首頁",
    confirmButtonColor: "#0b5a83",
    showDenyButton: true,
    denyButtonText: "發布新貼文",
    denyButtonColor: "#586676",
  });
  if (next.isDenied) {
    navigate("/new");
  } else {
    // Also on dismiss: the post is gone, so do not stay on its page.
    navigate("/");
  }
}

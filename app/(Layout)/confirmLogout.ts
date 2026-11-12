import Swal from "sweetalert2";

/** 「確定要登出嗎？」 before logging out (header menu and the 我的 page). */
export function confirmLogout(logout: () => void) {
  Swal.fire({
    text: "確定要登出嗎？",
    icon: "question",
    showCancelButton: true,
    cancelButtonText: "取消",
    confirmButtonText: "登出",
    confirmButtonColor: "#b42318",
  }).then((result) => {
    if (result.isConfirmed) {
      logout();
    }
  });
}

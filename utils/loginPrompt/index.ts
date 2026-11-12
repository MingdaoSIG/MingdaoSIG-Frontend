import Swal from "sweetalert2";

/**
 * Tells a logged-out user why an action needs an account and offers to log
 * in right there. `login` runs only when they pick 登入.
 */
export async function promptLogin(
  login: () => void,
  {
    title = "請先登入",
    text,
  }: {
    title?: string;
    text?: string;
  } = {},
) {
  const result = await Swal.fire({
    icon: "info",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "登入",
    cancelButtonText: "取消",
    confirmButtonColor: "#0b5a83",
  });
  if (result.isConfirmed) {
    login();
  }
}

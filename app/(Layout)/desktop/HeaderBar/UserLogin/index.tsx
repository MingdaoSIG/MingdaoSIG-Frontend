import Image from "next/image";
import Swal from "sweetalert2";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();

  if (isLoading) {
    return (
      <div className="flex h-10 w-28 items-center justify-center rounded-control bg-field font-medium text-ink-500 text-sm">
        Loading…
      </div>
    );
  }
  if (!isLogin) {
    return (
      <button
        type="button"
        className="h-10 cursor-pointer rounded-control bg-brand-700 px-6 font-semibold text-sm text-white shadow-[0_6px_16px_-10px_rgba(11,90,131,0.9)] transition-colors hover:bg-brand-800"
        onClick={() => login()}
      >
        Login
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {userData && userData.permission === 2 && (
        <button
          type="button"
          className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-brand-700 text-sm transition-colors hover:bg-field"
          onClick={() => window.open("/admin", "_self")}
        >
          管理平台
        </button>
      )}
      <button
        type="button"
        className="flex h-10 cursor-pointer items-center gap-2 rounded-control border border-line bg-surface py-1 pr-3.5 pl-1 text-left transition-colors hover:bg-field"
        onClick={() => confirmLogout(logout)}
      >
        <Image
          src={
            userData?.avatar ||
            `${process.env.NEXT_PUBLIC_API_URL}/image/653299930b891d1f6b5b4458`
          }
          width={32}
          height={32}
          alt=""
          className="size-8 rounded-full object-cover"
        />
        <span className="flex flex-col">
          <span className="font-semibold text-ink-900 text-sm leading-4">
            {userData?.name}
          </span>
          <span className="text-[11px] text-ink-500 leading-4">
            {userData?.email}
          </span>
        </span>
      </button>
    </div>
  );
}

function confirmLogout(logout: () => void) {
  Swal.fire({
    text: "Are you sure you want to logout?",
    icon: "question",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    confirmButtonText: "Sure!",
    confirmButtonColor: "#DC0032",
  }).then((result) => {
    if (result.isConfirmed) {
      logout();
    }
  });
}

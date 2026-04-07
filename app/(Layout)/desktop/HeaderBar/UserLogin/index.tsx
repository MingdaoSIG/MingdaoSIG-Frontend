import Image from "next/image";
import Swal from "sweetalert2";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();

  if (isLoading) {
    return (
      <div className="h-14 w-[15.75rem] cursor-pointer rounded-full bg-gradient-to-r from-[#6FA8FF] to-[#003F47] p-0.5">
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <p className="font-medium text-[#004C64] text-[1.2rem]">
            Loading ...
          </p>
        </div>
      </div>
    );
  }
  if (!isLogin) {
    return (
      <div
        className="h-14 w-[15.75rem] cursor-pointer rounded-full bg-gradient-to-r from-[#6FA8FF] to-[#003F47] p-0.5"
        onClick={() => login()}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
          <p className="font-medium text-[#004C64] text-[1.2rem]">Login</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      {userData && userData.permission === 2 && (
        <div
          className="mr-2 h-14 w-[7.7rem] cursor-pointer rounded-full bg-gradient-to-r from-[#6FA8FF] to-[#003F47] p-[0.15rem]"
          onClick={() => window.open("/admin", "_self")}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <p className="font-medium text-[#004C64] text-[1.25rem]">
              管理平台
            </p>
          </div>
        </div>
      )}
      <div
        className="flex h-14 w-[15.75rem] cursor-pointer flex-row items-center rounded-full bg-white/80 p-1"
        onClick={() => confirmLogout(logout)}
      >
        <Image
          src={
            userData?.avatar ||
            `${process.env.NEXT_PUBLIC_API_URL}/image/653299930b891d1f6b5b4458`
          }
          width={50}
          height={50}
          alt="Avatar"
          className="aspect-square h-full w-auto rounded-full"
        />
        <div className="ml-[0.4rem] flex h-full flex-col items-start justify-evenly">
          <p className="font-medium text-[1.2rem] leading-[1.2rem]">
            {userData?.name}
          </p>
          <p className="text-[#006180] text-[0.8rem] leading-[0.8rem]">
            {userData?.email}
          </p>
        </div>
      </div>
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

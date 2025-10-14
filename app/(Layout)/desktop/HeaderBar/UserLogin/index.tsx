import Image from "next/image";
import Swal from "sweetalert2";
import { useUserAccount } from "@/utils/useUserAccount";

export default function UserLogin() {
  const { isLogin, userData, isLoading, login, logout } = useUserAccount();

  if (isLoading) {
    return (
      <div className="w-[15.75rem] h-14 rounded-full p-0.5 cursor-pointer bg-gradient-to-r from-[#6FA8FF] to-[#003F47]">
        <div className="h-full w-full rounded-full bg-white flex justify-center items-center">
          <p className="text-[1.2rem] text-[#004C64] font-medium">Loading ...</p>
        </div>
      </div>
    );
  } else if (!isLogin) {
    return (
      <div
        className="w-[15.75rem] h-14 rounded-full p-0.5 cursor-pointer bg-gradient-to-r from-[#6FA8FF] to-[#003F47]"
        onClick={() => login()}
      >
        <div className="h-full w-full rounded-full bg-white flex justify-center items-center">
          <p className="text-[1.2rem] text-[#004C64] font-medium">Login</p>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex items-center justify-center">
        {userData && userData.permission === 2 && (
          <div
            className="w-[7.7rem] h-14 rounded-full p-[0.15rem] cursor-pointer bg-gradient-to-r from-[#6FA8FF] to-[#003F47] mr-2"
            onClick={() => window.open("/admin", "_self")}
          >
            <div className="h-full w-full rounded-full bg-white flex justify-center items-center">
              <p className="text-[1.25rem] text-[#004C64] font-medium">管理平台</p>
            </div>
          </div>
        )}
        <div
          className="w-[15.75rem] h-14 rounded-full bg-white/80 p-1 cursor-pointer flex flex-row items-center"
          onClick={() => confirmLogout(logout)}
        >
          <Image
            src={
              (userData && userData.avatar) ||
              process.env.NEXT_PUBLIC_API_URL +
              "/image/653299930b891d1f6b5b4458"
            }
            width={50}
            height={50}
            alt="Avatar"
            className="rounded-full aspect-square h-full w-auto"
          />
          <div className="ml-[0.4rem] h-full flex flex-col justify-evenly items-start">
            <p className="text-[1.2rem] leading-[1.2rem] font-medium">
              {userData && userData.name}
            </p>
            <p className="text-[#006180] text-[0.8rem] leading-[0.8rem]">
              {userData && userData.email}
            </p>
          </div>
        </div>
      </div>
    );
  }
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
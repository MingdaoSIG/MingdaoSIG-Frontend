"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function HashtagAll() {
  const route = useRouter();
  return (
    <div className="flex flex-col m-auto">
      <Image
        src={"/images/404.svg"}
        width={189}
        height={200}
        alt={"404"}
        className="m-auto"
      />
      <h1 className="text-[100px] mx-auto leading-[120px]">1969</h1>
      <p className="text-[50px] mx-auto">Page Under Construction.</p>
      <button
        className="bg-[#0090BD] bg-opacity-60 rounded-2xl w-[180px] h-[60px] block m-auto text-white mt-10 text-[20px]"
        onClick={() => {
          route.push("/");
        }}
      >
        Back to home
      </button>
    </div>
  );
}

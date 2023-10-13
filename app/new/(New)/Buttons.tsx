"use client";

import styles from "./MetaDataForm.module.scss";
import Image from "next/image";

export default function Buttons({ discard }: { discard: any }) {
  const handleDiscard = (e: any) => {
    discard(e);
  };

  return (
    <div className="h-[50px] mt-[10px] flex rounded-full gap-5">
      <button
        className={
          "flex-1 text-center rounded-full font-bold text-[18px] " +
          styles.btn_discard
        }
        onClick={handleDiscard}
      >
        <div className="flex flex-direction-column justify-content-space-between justify-center gap-1">
          <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
          DISCARD
        </div>
      </button>
      <button
        className={
          "flex-1 text-center rounded-full font-bold text-[18px] pr-[8px] " +
          styles.btn_post
        }
      >
        <div className="flex flex-direction-column justify-content-space-between justify-center gap-1">
          <Image
            src="/icons/cloud-upload.svg"
            width={28}
            height={28}
            alt="cloud-upload"
          />
          POST
        </div>
      </button>
    </div>
  );
}

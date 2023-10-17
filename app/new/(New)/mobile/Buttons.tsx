"use client";

import styles from "./button.module.scss";
import Image from "next/image";

export default function Buttons({ discard }: { discard: any }) {
  const handleDiscard = (e: any) => {
    discard(e);
  };

  return (
    <div className={styles.buttons}>
      <button className={styles.buttonDiscard} onClick={handleDiscard}>
        <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
        DISCARD
      </button>
      <button className={styles.buttonPost} type="submit">
        <Image
          src="/icons/cloud-upload.svg"
          width={28}
          height={28}
          alt="cloud-upload"
        />
        POST
      </button>
    </div>
  );
}

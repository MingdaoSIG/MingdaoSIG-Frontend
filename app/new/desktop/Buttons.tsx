"use client";

import { SweetAlertResult } from "sweetalert2";
import styles from "./Button.module.scss";
import Image from "next/image";

interface Props {
  discardFunction: Function;
  postFunction: Function;
}

export default function Buttons({ discardFunction, postFunction }: Props) {
  return (
    <div className={styles.buttons}>
      <button
        className={styles.buttonDiscard}
        onClick={(e) => discardFunction(e)}
      >
        <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
        DISCARD
      </button>
      <button
        className={styles.buttonPost}
        onClick={async () => await postFunction()}
      >
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

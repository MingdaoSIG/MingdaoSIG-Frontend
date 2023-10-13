"use client";

import styles from "./MetaDataForm.module.scss";
import Buttons from "./Buttons";

export default function MetaDataForm({ discard }: { discard: Function }) {
  return (
    <form className={"h-full"}>
      <div className={styles.meta}>
        <div className={"px-5 py-5 flex flex-col"}>
          <span className="text-lg">Title:</span>
          <input type="text" className={"rounded-full h-6"} />
          <span className="text-lg mt-2">SIGs:</span>
          <input type="text" className={"rounded-full h-6"} />
        </div>
      </div>
      <Buttons discard={() => discard()} />
    </form>
  );
}

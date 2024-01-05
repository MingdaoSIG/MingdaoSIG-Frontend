import styles from "./Button.module.scss";
import Image from "next/image";

interface Props {
  undoFunction: Function;
  // postFunction: Function;
  editButtonDisable: boolean;
}

export default function Buttons({
  undoFunction,
  // postFunction,
  editButtonDisable,
}: Props) {
  return (
    <div className={styles.buttons}>
      <button
        className={styles.buttonUndo}
        onClick={(e) => undoFunction(e)}
      >
        <Image src="/icons/trash.svg" width={22} height={22} alt="trash" />
        UNDO
      </button>
      <button
        className={styles.buttonEdit}
        // onClick={async () => await postFunction()}
        disabled={editButtonDisable}
      >
        <Image
          src="/icons/cloud-upload.svg"
          width={28}
          height={28}
          alt="cloud-upload"
        />
        EDIT
      </button>
    </div>
  );
}

import Image from "next/image";

// Styles
import styles from "./Reply.module.scss";

export default function Reply() {
  return (
    <div className={styles.reply}>
      <Image
        src={"/images/reply-avatar.svg"}
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
      <div className={styles.content}>
        <div className="info flex gap-2 items-center">
          <div className="no font-medium text-[12px]">@11v148</div>
          <div className="time text-[10px] text-[#BDBDBD] font-extralight">
            2023/09/19
          </div>
        </div>
        <p className="text-md-dark-green font-extralight text-[12px]">
          社長什麼時候才會交這個，我好想學喔
        </p>
      </div>
    </div>
  );
}

import Image from "next/image";
import { useRouter } from "next/navigation";

// Styles
import styles from "./Reply.module.scss";

export default function Reply({
  customId,
  avatar,
  content,
  createAt,
}: {
  customId: any;
  avatar: any;
  content: any;
  createAt: any;
}) {
  const route = useRouter();
  return (
    <div
      className={styles.reply}
      onClick={() => route.push(`/@${customId}`)}
    >
      <Image
        src={avatar}
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
      <div className={styles.content}>
        <div className="info flex gap-2 items-center">
          <div className="font-medium text-[12px]">@{customId}</div>
          <div className="time text-[10px] text-[#BDBDBD] font-extralight">
            {createdAt}
          </div>
        </div>
        <p className="text-md-dark-green font-extralight text-[12px]">
          {content}
        </p>
      </div>
    </div>
  );
}

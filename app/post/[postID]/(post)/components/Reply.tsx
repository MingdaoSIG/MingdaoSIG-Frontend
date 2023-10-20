import Image from "next/image";
import { useRouter } from "next/navigation";

// Styles
import styles from "./Reply.module.scss";

export default function Reply({
  customId,
  avatar,
  content,
  createdAt,
}: {
  customId: any;
  avatar: any;
  content: any;
  createdAt: any;
}) {
  const route = useRouter();
  return (
    <div className={styles.reply}>
      <Image
        src={avatar}
        width={45}
        height={45}
        alt="Avatar"
        className="rounded-full"
      ></Image>
      <div className={styles.content}>
        <div className="info flex gap-2 items-center">
          <div
            className={"font-semibold text-[12px] " + styles.name}
            onClick={() => route.push(`/@${customId}`)}
          >
            @{customId}
          </div>
          <div className="time text-[10px] text-[#979797] font-extralight">
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

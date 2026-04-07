import Image from "next/image";
import { useRouter } from "next/navigation";
import Linkify from "react-linkify";
import { jumpOut } from "@/utils/jumpOut";

// Styles
import styles from "./Reply.module.scss";

export default function Reply({
  customId,
  avatar,
  content,
  createdAt,
  overflow,
  first,
}: {
  customId: any;
  avatar: any;
  content: any;
  createdAt: any;
  overflow: boolean;
  first?: boolean;
}) {
  const route = useRouter();

  const JumpOut = jumpOut;

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
            className={`font-semibold text-[12px] ${!first && styles.name}`}
            onClick={() => {
              if (!first) {
                route.push(`/@${customId}`);
              }
            }}
            id="customId"
          >
            @{customId}
          </div>
          <div className="time text-[10px] text-[#979797] font-extralight">
            {createdAt}
          </div>
        </div>
        <p
          className={
            "text-md-dark-green font-extralight text-[12px] break-words " +
            (overflow ? "w-[65dvw] truncate " : " ") +
            styles.content
          }
        >
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                className={" break-words "}
                key={key}
                onClick={() => {
                  if (!first) {
                    JumpOut(decoratedHref);
                  }
                }}
              >
                {decoratedText}
              </button>
            )}
          >
            {content}
          </Linkify>
        </p>
      </div>
    </div>
  );
}

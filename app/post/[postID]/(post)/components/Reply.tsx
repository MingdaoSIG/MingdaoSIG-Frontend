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
  customId: string;
  avatar: string;
  content: string;
  createdAt: string;
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
        <div className="info flex items-center gap-2">
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
          <div className="time font-extralight text-[#979797] text-[10px]">
            {createdAt}
          </div>
        </div>
        <p
          className={
            "break-words font-extralight text-[12px] text-md-dark-green" +
            (overflow ? "w-[65dvw] truncate" : " ") +
            styles.content
          }
        >
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                className={"break-words"}
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

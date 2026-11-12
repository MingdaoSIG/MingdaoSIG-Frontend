import Image from "next/image";
import { useRouter } from "next/navigation";
import Linkify from "@/components/Linkify/Linkify";
import { jumpOut } from "@/utils/jumpOut";

export default function Reply({
  customId,
  name,
  avatar,
  content,
  createdAt,
  overflow,
  first,
}: {
  customId?: string;
  /** Shown first when the API includes it; @customId stays as secondary. */
  name?: string;
  avatar?: string;
  content: string;
  createdAt: string;
  overflow: boolean;
  first?: boolean;
}) {
  const route = useRouter();

  return (
    <div className="flex w-full cursor-default items-start gap-2.5 text-left">
      <Image
        src={avatar || "/images/default-avatar.png"}
        width={36}
        height={36}
        alt=""
        className="size-9 shrink-0 rounded-full object-cover"
      />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          {customId ? (
            <button
              type="button"
              className={`font-semibold text-[0.85rem] text-ink-900 ${
                first ? "cursor-default" : "cursor-pointer hover:underline"
              }`}
              onClick={() => {
                if (!first) {
                  route.push(`/@${customId}`);
                }
              }}
            >
              {name || `@${customId}`}
            </button>
          ) : (
            <span className="font-semibold text-[0.85rem] text-ink-500">
              已刪除的使用者
            </span>
          )}
          {customId && name && (
            <span className="truncate text-ink-500 text-xs">@{customId}</span>
          )}
          <span className="shrink-0 text-ink-500 text-xs">{createdAt}</span>
        </div>
        <p
          className={`mt-0.5 break-words text-[0.9rem] text-ink-700 leading-[1.65] ${
            overflow ? "w-[65dvw] truncate" : ""
          }`}
        >
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                className="break-all text-left text-brand-700 hover:underline"
                key={key}
                onClick={() => {
                  if (!first) {
                    jumpOut(decoratedHref);
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

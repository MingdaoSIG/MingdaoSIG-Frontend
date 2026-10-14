"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
// Interfaces
import type { TComments } from "@/interfaces/comments";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
// Custom Hooks
import useAlert from "@/utils/useAlert";
// Utils
import { useUserAccount } from "@/utils/useUserAccount";

// API Request Function
import { GetCommentAPI, PostCommentAPI } from "../apis/CommentAPI";
// Components
import Reply from "../components/Reply";

// Configs
import { alertMessageConfigs } from "../configs/alertMessages";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ThreadInfo({ post }: { post: TThread }) {
  const [typeComments, setTypeComments] = useState<string>("");
  const [typeText, setTypeText] = useState(false);
  const [comments, setComments] = useState<TComments[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [sig, setSig] = useState<Sig | null>(null);
  const { token, isLogin } = useUserAccount();
  const { showAlert } = useAlert();

  // 使用 ref 追蹤組件是否已卸載
  const isMounted = useRef(true);

  const route = useRouter();

  async function handleCommandSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isLogin) {
      return showAlert(alertMessageConfigs.noLogin);
    }
    const reply = "";
    const content = typeComments;
    if (typeComments.length === 0) {
      return showAlert(alertMessageConfigs.noComment);
    }
    try {
      const res = await PostCommentAPI(post?._id, reply, content, token);
      if (res.status === 2000) {
        setTypeComments("");
        showAlert(alertMessageConfigs.commentSuccess).then(async () => {
          await GetCommentAPI(post).then((res) => {
            setComments(res.data);
          });
        });
      }
    } catch (_e) {
      Swal.fire(alertMessageConfigs.otherError);
    }
  }

  useEffect(() => {
    // 重置掛載狀態
    isMounted.current = true;

    // 創建 AbortController 用於取消請求
    const controller = new AbortController();

    async function GetUserAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/user/${post.user}`, {
            method: "GET",
            signal: controller.signal,
          })
        ).json();

        // 只有在組件仍然掛載時才更新狀態
        if (isMounted.current) {
          setUser(res.data);
        }
      } catch (error: unknown) {
        if ((error as Error).name !== "AbortError") {
          // Non-abort fetch errors are silently ignored - UI shows fallback
        }
      }
    }

    async function GetSigAPI() {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/${post.sig}`, {
            method: "GET",
            signal: controller.signal,
          })
        ).json();

        // 只有在組件仍然掛載時才更新狀態
        if (isMounted.current) {
          setSig(res.data);
        }
      } catch (error: unknown) {
        if ((error as Error).name !== "AbortError") {
          // Non-abort fetch errors are silently ignored - UI shows fallback
        }
      }
    }

    async function GetCommentsAPI() {
      try {
        const res = await GetCommentAPI(post);
        // 只有在組件仍然掛載時才更新狀態
        if (isMounted.current) {
          setComments(res.data);
        }
      } catch (error: unknown) {
        if ((error as Error).name !== "AbortError") {
          // Non-abort fetch errors are silently ignored - UI shows fallback
        }
      }
    }

    GetUserAPI();
    GetSigAPI();
    GetCommentsAPI();

    // 清理函數
    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, [post]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Author */}
      <div className="glass flex shrink-0 select-none items-center gap-3 rounded-card px-5 py-4">
        <Image
          src={user?.avatar || "/images/default-avatar.png"}
          width={48}
          height={48}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5 text-base">
            <button
              type="button"
              className="cursor-pointer truncate font-bold text-ink-900 hover:underline"
              onClick={() => route.push(`/@${user?.customId}`)}
            >
              {user?.name || "Loading..."}
            </button>
            <span aria-hidden className="text-ink-400">
              •
            </span>
            <button
              type="button"
              className="sig-text shrink-0 cursor-pointer font-semibold hover:underline"
              style={{
                ["--sig-color" as string]: sigDefaultColors[sig?._id ?? ""],
              }}
              onClick={() => route.push(`/@${sig?.customId}`)}
            >
              {sig?.name || "Loading..."}
            </button>
          </div>
          <div className="text-[13px] text-ink-500">
            {
              new Date(post?.createdAt ?? "")
                .toLocaleString("zh-TW")
                .split(" ")[0]
            }
          </div>
        </div>
      </div>

      {/* Comments: sized to content, scrolls when it runs out of room */}
      <div className="glass flex min-h-0 flex-col rounded-card px-5 pt-4 pb-5">
        <div className="custom-scrollbar flex min-h-12 flex-col gap-4 overflow-y-auto overflow-x-hidden">
          {comments.length !== 0 ? (
            comments.map((comment: TComments) => {
              return (
                <Reply
                  key={comment._id}
                  overflow={false}
                  customId={comment.user.customId}
                  avatar={comment.user.avatar}
                  content={comment.content}
                  createdAt={
                    new Date(comment.createdAt || "")
                      .toLocaleString("zh-TW")
                      .split(" ")[0]
                  }
                />
              );
            })
          ) : (
            <p className="py-4 text-center text-ink-500 text-sm">No comments</p>
          )}
        </div>
        <form
          className="mt-4 flex h-10 w-full shrink-0 items-center rounded-control border border-line bg-field pl-1 focus-within:ring-2 focus-within:ring-brand-700/30"
          onSubmit={handleCommandSubmit}
        >
          <input
            className="h-full w-full flex-1 bg-transparent px-3 text-ink-800 text-sm placeholder:text-ink-400 focus-visible:outline-none disabled:cursor-not-allowed"
            placeholder="Reply..."
            onChange={(e) => {
              e.target.value.length > 0
                ? setTypeText(true)
                : setTypeText(false);
              setTypeComments(e.target.value);
            }}
            value={typeComments}
          />
          <button
            type="submit"
            aria-label="送出留言"
            className="flex h-full w-10 flex-none items-center justify-center"
          >
            <Image
              src={"/icons/bx-send.svg"}
              height={20}
              width={20}
              alt=""
              className={
                typeText && isLogin
                  ? "cursor-pointer opacity-100"
                  : "cursor-not-allowed opacity-30"
              }
            />
          </button>
        </form>
      </div>
    </div>
  );
}

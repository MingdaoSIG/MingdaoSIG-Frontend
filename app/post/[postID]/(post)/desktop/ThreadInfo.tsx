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
// Styles
import style from "./Thread.module.scss";

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
    <div className={`${style.info} box-border`}>
      <div className="relative mb-3 flex h-[64px] flex-initial items-center justify-between">
        <div className={`${style.author} select-none`}>
          <Image
            src={user?.avatar || "/images/default-avatar.png"} // Make sure to add a default avatar image
            width={64}
            height={64}
            alt="Avatar"
            className="h-[64px] w-[64px] flex-initial rounded-full"
          />

          <div className="my-auto flex w-auto flex-initial flex-col items-start">
            <div className="flex">
              <div
                className={`${style.name} flex`}
                onClick={() => route.push(`/@${user?.customId}`)}
              >
                {user?.name || "Loading..."}
              </div>
              <p className={style.dot}>•</p>
              <div
                className={style.name}
                style={{ color: sigDefaultColors[sig?._id ?? ""] }}
                onClick={() => route.push(`/@${sig?.customId}`)}
              >
                {sig?.name || "Loading..."}
              </div>
            </div>
            <div className={style.time}>
              {
                new Date(post?.createdAt ?? "")
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex h-[calc(100%-42px-64px)] flex-col gap-[10px] overflow-x-hidden overflow-y-auto">
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
          <p className="mx-auto my-auto font-medium text-[1.5rem]">
            No comments
          </p>
        )}
      </div>
      <form
        className="bottom-5 mt-5 flex h-[42px] w-full flex-none rounded-full border border-[#BDBDBD] bg-[#D5E5E8] pl-[12px]"
        onSubmit={handleCommandSubmit}
      >
        <input
          className="h-full w-full flex-1 bg-transparent px-3 focus-visible:outline-none disabled:cursor-not-allowed"
          placeholder="Reply..."
          onChange={(e) => {
            e.target.value.length > 0 ? setTypeText(true) : setTypeText(false);
            setTypeComments(e.target.value);
          }}
          value={typeComments}
          // disabled
        />
        <button type="submit" className="h-full w-[40px] flex-none">
          <Image
            src={"/icons/bx-send.svg"}
            height={24}
            width={24}
            alt="send"
            className={
              "mt-auto h-full" +
              (typeText && isLogin
                ? "cursor-pointer opacity-100"
                : "cursor-not-allowed opacity-30")
            }
          />
        </button>
      </form>
    </div>
  );
}

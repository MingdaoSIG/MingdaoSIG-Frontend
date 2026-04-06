"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
// Interfaces
import type { TThread } from "@/interfaces/Thread";
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
  const [comments, setComments] = useState<any>([]);
  const [user, setUser] = useState<any>(null);
  const [sig, setSig] = useState<any>(null);
  const { token, isLogin } = useUserAccount();
  const { showAlert } = useAlert();

  // 使用 ref 追蹤組件是否已卸載
  const isMounted = useRef(true);

  const route = useRouter();

  async function handleCommandSubmit(e: any) {
    e.preventDefault();
    if (!isLogin) return showAlert(alertMessageConfigs.noLogin);
    const reply = "";
    const content = typeComments;
    if (typeComments.length === 0)
      return showAlert(alertMessageConfigs.noComment);
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
    } catch (e) {
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
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log(error);
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
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log(error);
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
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log(error);
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
    <div className={style.info + " box-border"}>
      <div className="flex justify-between items-center flex-initial relative h-[64px] mb-3">
        <div className={style.author + " select-none"}>
          <Image
            src={user?.avatar || "/images/default-avatar.png"} // Make sure to add a default avatar image
            width={64}
            height={64}
            alt="Avatar"
            className="rounded-full w-[64px] h-[64px] flex-initial"
          />

          <div className="flex flex-col items-start my-auto flex-initial w-auto">
            <div className="flex">
              <div
                className={style.name + " flex"}
                onClick={() => route.push(`/@${user?.customId}`)}
              >
                {user?.name || "Loading..."}
              </div>
              <p className={style.dot}>•</p>
              <div
                className={style.name}
                style={{ color: sigDefaultColors[sig?._id] }}
                onClick={() => route.push(`/@${sig?.customId}`)}
              >
                {sig?.name || "Loading..."}
              </div>
            </div>
            <div className={style.time}>
              {new Date(post?.createdAt!).toLocaleString("zh-TW").split(" ")[0]}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-[10px] overflow-y- overflow-x-hidden h-[calc(100%-42px-64px)]">
        {comments.length !== 0 ? (
          comments.map((comment: any) => {
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
          <p className="mx-auto font-medium text-[1.5rem] my-auto">
            No comments
          </p>
        )}
      </div>
      <form
        className="h-[42px] w-full flex-none bg-[#D5E5E8] rounded-full mt-5 border border-[#BDBDBD] pl-[12px] flex bottom-5"
        onSubmit={handleCommandSubmit}
      >
        <input
          className="focus-visible:outline-none px-3 w-full h-full bg-transparent flex-1 disabled:cursor-not-allowed"
          placeholder="Reply..."
          onChange={(e) => {
            e.target.value.length > 0 ? setTypeText(true) : setTypeText(false);
            setTypeComments(e.target.value);
          }}
          value={typeComments}
          // disabled
        />
        <button className="h-full w-[40px] flex-none">
          <Image
            src={"/icons/bx-send.svg"}
            height={24}
            width={24}
            alt="send"
            className={
              "mt-auto h-full " +
              (typeText && isLogin
                ? "opacity-100 cursor-pointer"
                : "opacity-30 cursor-not-allowed")
            }
          />
        </button>
      </form>
    </div>
  );
}

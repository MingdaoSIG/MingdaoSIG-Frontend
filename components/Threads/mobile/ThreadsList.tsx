import Image from "next/image";
import Link from "next/link";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FetchNextPageOptions,
  InfiniteQueryObserverResult,
  InfiniteData,
} from "@tanstack/react-query";

// Styles
import style from "./ThreadsList.module.scss";
import skeleton from "./Skeleton.module.scss";

// Interfaces, Types
import { TThread } from "@/interfaces/Thread";
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

// Modules
import markdownToPlainText from "@/modules/markdownToPlainText";

// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";
import { getPostCommentAPI } from "@/app/(home)/apis/getPostComment";

const announcementSigId = "652d60b842cdf6a660c2b778";

const Thread = ({ threadData }: { threadData: TThread }) => {
  const [comments, setComments] = useState<any>([]);
  const user = threadData.user as User;
  const sig = threadData.sig as Sig;

  useEffect(() => {
    getPostCommentAPI(threadData).then((res) => {
      if (res) {
        setComments(res.data);
      }
    });
  }, [threadData]);

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={style.thread + "  cursor-pointer select-none "}
      style={{
        backgroundColor: threadData.pinned ? "white" : "",
      }}
    >
      <div className={style.preview}>
        <div
          className={style.info}
          style={{
            display:
              !user || !sig || sig?._id === "652d60b842cdf6a660c2b778"
                ? "none"
                : "flex",
          }}
        >
          {" "}
          <div className={style.user_sig}>
            <p className={style.user}>{user?.name}</p>
            <span>•</span>
            <p style={{ color: sigDefaultColors[sig?._id!] }}>{sig?.name}</p>
          </div>
          <div className={style.statist}>
            <p className={style.date}>
              {
                new Date(threadData.createdAt!)
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </p>
            <span className={style.date}>•</span>
            <p>{threadData.likes} likes</p>
            <span>•</span>
            <p>{comments.length} replies</p>
          </div>
        </div>

        <div className={style.title_bar}>
          <h1 className={style.previewTitle}>
            {threadData.sig === announcementSigId && "🔔 公告 - "}
            {threadData.title}
            {threadData.pinned && " • 已置頂"}
          </h1>
        </div>

        <p
          className={style.previewContent}
          style={{
            WebkitLineClamp:
              sig?._id === "652d60b842cdf6a660c2b778" ? "4" : "3",
          }}
        >
          {markdownToPlainText(threadData.content)}
        </p>
      </div>
    </Link>
  );
};

const ThreadSkeleton = () => {
  return (
    <div className={skeleton.thread}>
      <div className={skeleton.preview}>
        <div className={skeleton.info}>
          <p className={skeleton.user}></p>
          <span>•</span>
          <p className={skeleton.sig}></p>
        </div>
        <div className={skeleton.title}></div>
        <p className={skeleton.content}></p>
      </div>
      <div className={skeleton.cover}></div>
    </div>
  );
};

export const InfinityThreadsList = ({
  data,
  height,
  fetchNextPage,
  isFetchingNextPage,
}: {
  data: any;
  height?: string;
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined
  ) => Promise<
    InfiniteQueryObserverResult<InfiniteData<TThread[], unknown>, Error>
  >;
  isFetchingNextPage: boolean;
}) => {
  const postList = useRef(null);

  const onScroll = useCallback(() => {
    if (postList.current) {
      const { scrollTop, scrollHeight, clientHeight } = postList.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 600;

      if (isNearBottom && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [fetchNextPage, isFetchingNextPage]);

  useEffect(() => {
    const listInnerElement: HTMLElement = postList.current!;

    if (listInnerElement) {
      listInnerElement.addEventListener("touchmove", onScroll);

      return () => {
        listInnerElement.removeEventListener("touchmove", onScroll);
      };
    }
  }, [onScroll]);

  return data && data.pages[0].length >= 1 ? (
    <div className={style.threads} style={{ height }} ref={postList}>
      {data.pages.map((page: TThread[], index: number) => (
        <Fragment key={index}>
          {page.map((item, index) => {
            return <Thread threadData={item} key={index} />;
          })}
        </Fragment>
      ))}
      {data && isFetchingNextPage && <ThreadSkeleton />}
    </div>
  ) : (
    <div className={style.noPost}>
      <h1>No Post Yet</h1>
    </div>
  );
};

export const ThreadsListSkeleton = ({
  repeat,
  height,
}: {
  repeat: number;
  height?: string;
}) => {
  return (
    <div className={style.threads} style={{ height }}>
      {[...Array(repeat)].map((_, index) => (
        <ThreadSkeleton key={index} />
      ))}
    </div>
  );
};

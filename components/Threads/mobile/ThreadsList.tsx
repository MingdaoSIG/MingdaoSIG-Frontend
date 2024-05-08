import Link from "next/link";
import Image from "next/image";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
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
import { announcementSigId, announcementStayTime } from "../configs/announcement";

const Thread = ({ threadData }: { threadData: TThread }) => {
  const user = threadData.user as User;
  const sig = threadData.sig as Sig;
  const isAnnouncement = sig._id === announcementSigId;

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={style.thread + "  cursor-pointer select-none "}
      style={{
        backgroundColor: isAnnouncement ? "white" : "",
      }}
    >
      <div className={style.preview}>
        <div
          className={style.info}
          style={{
            display:
              !user || isAnnouncement
                ? "none"
                : "flex",
          }}
        >
          <div className={style.user_sig}>
            <p className={style.user}>{user?.name}</p>
            <span>•</span>
            <p style={{ color: sigDefaultColors[sig._id!] }}>{sig.name}</p>
          </div>
          <div className={style.statist}>
            <p className={style.date}>
              {
                new Date(threadData.createdAt!)
                  .toLocaleString("zh-TW")
                  .split(" ")[0]
              }
            </p>
            <div className={style.likes}>
              <Image
                src="/icons/likes.svg"
                alt="likes"
                width={16}
                height={16}
                className="my-auto"
              />
              <p>
                {threadData.likes}
              </p>
            </div>
            <div className={style.comments}>
              <Image
                src="/icons/comments.svg"
                alt="comments"
                width={16}
                height={16}
                className="my-auto"
              />
              <p>
                {threadData.comments}
              </p>
            </div>
          </div>
        </div>

        <div className={style.title_bar}>
          <h1 className={style.previewTitle}>
            {isAnnouncement && "🔔 公告 - "}
            {threadData.title}
            {/* {threadData.pinned && " • 已置頂"} */}
          </h1>
        </div>

        <p
          className={style.previewContent}
          style={{
            WebkitLineClamp:
              isAnnouncement ? "3" : "1",
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
  announcementData,
}: {
  data: any;
  height?: string;
  fetchNextPage: (
    options?: FetchNextPageOptions | undefined
  ) => Promise<
    InfiniteQueryObserverResult<InfiniteData<TThread[], unknown>, Error>
  >;
  isFetchingNextPage: boolean;
  announcementData?: any
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
      {
        (announcementData && announcementData.pages[0].length >= 1) && (
          announcementData.pages.map((page: TThread[], index: number) => {
            const currentDate = new Date().getTime();
            const postDate = new Date(page[0].createdAt!).getTime();
            const diffDays = Math.floor((currentDate - postDate) / (1000 * 60 * 60 * 24));

            if (diffDays < announcementStayTime) {
              return <Thread threadData={page[0]} key={index} />;
            }
          })
        )
      }
      {data.pages.map((page: TThread[], index: number) => (
        <Fragment key={index}>
          {page.map((item, index) => {
            const sig = item.sig as Sig;
            const isAnnouncement = sig._id === announcementSigId;
            if (!isAnnouncement) {
              return <Thread threadData={item} key={index} />;
            }
          })}
        </Fragment>
      ))}
      {isFetchingNextPage && <ThreadSkeleton />}
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

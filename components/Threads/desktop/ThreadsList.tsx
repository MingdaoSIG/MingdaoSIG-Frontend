import Image from "next/image";
import Link from "next/link";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { FetchNextPageOptions, InfiniteQueryObserverResult, InfiniteData } from "@tanstack/react-query";

// Styles
import style from "./ThreadsList.module.scss";
import skeleton from "./Skeleton.module.scss";

// Interfaces, Types
import { IThread } from "@/interfaces/Thread.interface";
import { User } from "@/interfaces/User";
import { Sig } from "@/interfaces/Sig";

// Modules
import markdownToPlainText from "@/modules/markdownToPlainText";
import sigAPI from "@/modules/sigAPI";

// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";

const announcementSigId = "652d60b842cdf6a660c2b778";

const Thread = ({ threadData }: { threadData: IThread }) => {
  const [sig, setSig] = useState<Sig | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const userData = await sigAPI.getUserData(threadData.user);
        setUser(userData);

        const sigData = await sigAPI.getSigData(threadData.sig);
        setSig(sigData);
      } catch (error: any) {
        console.error(error.message);
      }
    })();
  }, [threadData.sig, threadData.user]);

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
          <p className={style.user}>{user?.name} </p>
          <span>•</span>
          <p style={{ color: sigDefaultColors[sig?._id!] }}>{sig?.name}</p>
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
      <div
        className={style.cover}
        style={{
          display: threadData.pinned ? "none" : "",
        }}
      >
        <Image
          src={threadData.cover}
          alt="cover image"
          style={{ objectFit: "cover" }}
          priority
          sizes="100%"
          fill
        ></Image>
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
  isFetchingNextPage
}: {
  data: any,
  height?: string,
  fetchNextPage: (options?: FetchNextPageOptions | undefined) => Promise<InfiniteQueryObserverResult<InfiniteData<IThread[], unknown>, Error>>,
  isFetchingNextPage: boolean
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
      listInnerElement.addEventListener("scroll", onScroll);

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
      };
    }
  }, [onScroll]);

  return data && data.pages[0].length >= 1 ? (
    <div className={style.threads} style={{ height }} ref={postList}>
      {data.pages.map((page: IThread[], index: number) => (
        <Fragment key={index}>
          {page.map((item, index) => {
            return <Thread threadData={item} key={index} />;
          })}
        </Fragment>
      ))}
      {data && isFetchingNextPage && (
        <ThreadSkeleton />
      )}
    </div>
  ) : (
    <div className={style.noPost}>
      <h1>No Post Yet</h1>
    </div>
  );
};

export const ThreadsListSkeleton = ({ repeat, height }: { repeat: number, height?: string }) => {
  return (
    <div className={style.threads} style={{ height }}>
      {[...Array(repeat)].map((_, index) => <ThreadSkeleton key={index} />)}
    </div>
  );
};
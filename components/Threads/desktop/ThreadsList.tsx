import Image from "next/image";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FetchNextPageOptions, InfiniteQueryObserverResult, InfiniteData } from "@tanstack/react-query";

// Styles
import style from "./ThreadsList.module.scss";

// Interfaces
import { IThread } from "@/interfaces/Thread.interface";

// Modules
import markdownToPlainText from "@/modules/markdownToPlainText";

// Configs
import { sigDefaultColors } from "../configs/sigDefaultColors";
import Link from "next/link";

const announcementSigId = "652d60b842cdf6a660c2b778";
const pinned = [
  "652e4591d04b679afdff697e",
  "65325fce0b891d1f6b5b3131",
  "652cabdb45c0be8f82c54d9a",
];

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  const [sig, setSig] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    GetUserAPI();
    GetSigAPI();

    async function GetUserAPI() {
      try {
        const res = await (
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user/${threadData.user}`,
            {
              method: "GET",
            }
          )
        ).json();
        setUser(res.data);

        return;
      } catch (error) {
        console.log(error);
      }
    }

    async function GetSigAPI() {
      try {
        const res = await (
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/sig/${threadData.sig}`,
            {
              method: "GET",
            }
          )
        ).json();
        setSig(res.data);

        return;
      } catch (error) {
        console.log(error);
      }
    }
  }, [threadData.sig, threadData.user]);

  return (
    <Link
      href={`/post/${threadData._id}`}
      className={style.thread + "  cursor-pointer select-none "}
      style={{
        backgroundColor: pinned.includes(threadData._id!) ? "white" : "",
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
          <p style={{ color: sigDefaultColors[sig?._id] }}>{sig?.name}</p>
        </div>

        <div className={style.title_bar}>
          <h1 className={style.previewTitle}>
            {threadData.sig === announcementSigId && "🔔 公告 - "}
            {threadData.title}
            {pinned.includes(threadData._id!) && " • 已置頂"}
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
          display: pinned.includes(threadData._id!) ? "none" : "",
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

export const ThreadsList = ({
  posts,
  height,
}: {
  posts: IThread[];
  height?: string;
}) => {
  return (
    <div className={style.threads} style={{ height: height }}>
      {posts && posts?.length >= 1 ? (
        posts.map((item, index) => {
          return <Thread threadData={item} key={index} />;
        })
      ) : (
        <div
          className={
            "h-full w-full text-center justify-center align-middle font-bold text-[40px]"
          }
        >
          No Post Yet.
        </div>
      )}
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

  const onScroll = () => {
    if (postList.current) {
      const { scrollTop, scrollHeight, clientHeight } = postList.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 600;

      if (isNearBottom) {
        fetchNextPage();
      }
    }
  };

  useEffect(() => {
    const listInnerElement: HTMLElement = postList.current!;

    if (listInnerElement) {
      listInnerElement.addEventListener("scroll", onScroll);

      return () => {
        listInnerElement.removeEventListener("scroll", onScroll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={style.threads} style={{ height }} ref={postList}>
      {data && data.pages.length >= 1 ? (
        data.pages.map((page: IThread[], index: number) => (
          <Fragment key={index}>
            {page.map((item, index) => {
              return <Thread threadData={item} key={index} />;
            })}
          </Fragment>
        ))
      ) : (
        <div
          className={
            "h-full w-full text-center justify-center align-middle font-bold text-[40px]"
          }
        >
          No Post Yet.
        </div>
      )}

      {data && data.pages[data.pages.length - 1].length > 0 && isFetchingNextPage && (
        <p>Loading ...</p>
      )}
    </div>
  );
};
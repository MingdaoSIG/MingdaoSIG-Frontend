import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interfaces/Thread.interface";
import { useRouter } from "next/navigation";
import markdownToPlainText from "@/modules/markdownToPlainText";
import { useEffect, useState } from "react";

const announcementSigId = "652d60b842cdf6a660c2b778";
const pinned = ["652e4591d04b679afdff697e", "652cabdb45c0be8f82c54d9a"];

const sigDefaultColor: { [key: string]: string } = {
  "651799ebfa1d45d97b139864": "rgb(35, 135, 200)", // 資安
  "6529ed87df4ae96f279cd5e3": "rgb(35, 135, 200)", // 資訊程式設計
  "6529ee3cdf4ae96f279cd5e4": "rgb(35, 135, 200)", // 機器人設計與製造
  "6529ee57df4ae96f279cd5e5": "rgb(35, 135, 200)", // 建築設計
  "6529eed9df4ae96f279cd5e6": "rgb(0, 170, 115)", // 生科動科與環境
  "6529eeeddf4ae96f279cd5e7": "rgb(0, 170, 115)", // 醫學
  "6529efbfdf4ae96f279cd5ec": "rgb(0, 170, 115)", // 醫學相關
  "6529efe9df4ae96f279cd5ee": "rgb(160, 100, 55)", // 法政
  "6529effbdf4ae96f279cd5ef": "rgb(160, 100, 55)", // 社心教育
  "6529f011df4ae96f279cd5f0": "rgb(250, 170, 190)", // 音樂表藝
  "6529f05ddf4ae96f279cd5f1": "rgb(250, 170, 190)", // 大眾傳播
  "6529f06edf4ae96f279cd5f2": "rgb(250, 170, 190)", // 文史哲
  "6529f07ddf4ae96f279cd5f3": "rgb(160, 100, 55)", // 財經
  "6529f094df4ae96f279cd5f4": "rgb(35, 135, 200)", // 無人機
  "6529f0a2df4ae96f279cd5f5": "rgb(250, 170, 190)", // 經濟與管理
  "6529f0c4df4ae96f279cd5f6": "rgb(250, 170, 190)", // 元宇宙
  "6529f0dbdf4ae96f279cd5f7": "rgb(250, 170, 190)", // 直播
  "6529f0eedf4ae96f279cd5f8": "rgb(35, 135, 200)", // 科學教育
  "652b851ca1bd096e024475c4": "rgb(35, 135, 200)", // 雲端
};

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
    <div
      className={style.thread + "  cursor-pointer select-none "}
      onClick={() => router.push("/post/" + threadData._id)}
      style={{
        backgroundColor: pinned.includes(threadData._id) ? "white" : "",
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
          <p className={style.user}>{user?.name + " • "} </p>
          <p style={{ color: sigDefaultColor[sig?._id] }}>{sig?.name}</p>
        </div>

        <div className={style.title_bar}>
          <h1 className={style.previewTitle}>
            {threadData.sig === announcementSigId && "🔔 公告 - "}
            {threadData.title}
            {pinned.includes(threadData._id) && " • 已置頂"}
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
          display: pinned.includes(threadData._id) ? "none" : "",
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
    </div>
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

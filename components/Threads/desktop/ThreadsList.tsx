import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";
import MarkdownToPlainText from "@/modules/MarkdownToPlainText";

const announcementSigId = "652d60b842cdf6a660c2b778";
const pinned = [
  "652cabdb45c0be8f82c54d9a",
  "652e4591d04b679afdff697e"
];

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div
      className={style.thread + "  cursor-pointer select-none "}
      onClick={() => router.push("/post/" + threadData._id)}
      style={{
        backgroundColor: pinned.includes(threadData._id) ? "white" : ""
      }}
    >
      <div className={style.preview}>
        <h1 className={style.previewTitle}>
          {threadData.sig === announcementSigId && "🔔 公告 - "}
          {threadData.title}
          {pinned.includes(threadData._id) && " • 已置頂"}
        </h1>
        <p className={style.previewContent}>
          {MarkdownToPlainText(threadData.content)}
        </p>
      </div>
      <div
        className={style.cover}
        style={{
          display: pinned.includes(threadData._id) ? "none" : ""
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
      {posts ? (
        posts.map((item, index) => {
          return <Thread threadData={item} key={index} />;
        })
      ) : (
        <div className={style.loading}>Loading...</div>
      )}
    </div>
  );
};
import Image from "next/image";
import style from "./ThreadsList.module.scss";
import { IThread } from "@/interface/Thread.interface";
import { useRouter } from "next/navigation";

const Thread = ({ threadData }: { threadData: IThread }) => {
  const router = useRouter();
  return (
    <div
      className={style.thread + "  cursor-pointer select-none "}
      onClick={() => router.push("/post/" + threadData._id)}
      style={{
        backgroundColor:
          (threadData._id === "652cabdb45c0be8f82c54d9a" && "white") || "",
      }}
    >
      <div className={style.preview}>
        <h1 className={style.previewTitle}>
          {threadData.sig === "652d60b842cdf6a660c2b778" && "🔔 公告 - "}
          {threadData.title}
          {threadData._id === "652cabdb45c0be8f82c54d9a" && " • 已置頂"}
        </h1>
        <p className={style.previewContent}>{threadData.content}</p>
      </div>
      <div
        className={style.cover}
        style={{
          display:
            (threadData._id === "652cabdb45c0be8f82c54d9a" && "none") || "",
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
        <div className={style.loading}>Loading...</div>
      )}
    </div>
  );
};

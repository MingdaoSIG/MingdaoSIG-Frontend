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
          ((threadData._id === "652cabdb45c0be8f82c54d9a" ||
            threadData._id === "652e4591d04b679afdff697e") &&
            "white") ||
          "",
      }}
    >
      <div className={style.preview}>
        <h1 className={style.previewTitle}>
          {threadData.sig === "652d60b842cdf6a660c2b778" && "🔔 公告 - "}
          {threadData.title}
          {(threadData._id === "652cabdb45c0be8f82c54d9a" ||
            threadData._id === "652e4591d04b679afdff697e") &&
            " • 已置頂"}
        </h1>
        <p className={style.previewContent}>
          {markdownToPlainText(threadData.content)}
        </p>
      </div>
      <div
        className={style.cover}
        style={{
          display:
            ((threadData._id === "652cabdb45c0be8f82c54d9a" ||
              threadData._id === "652e4591d04b679afdff697e") &&
              "none") ||
            "",
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

function markdownToPlainText(markdown: string) {
  // Remove headings
  markdown = markdown.replace(/#+\s+(.*)/g, "$1");

  // Remove bold and italic formatting
  markdown = markdown.replace(/(\*\*|__)(.*?)\1/g, "$2");
  markdown = markdown.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove inline code formatting
  markdown = markdown.replace(/`([^`]+)`/g, "$1");

  // Remove images
  markdown = markdown.replace(/!\[(.*?)\]\(.*?\)/g, "$1");

  // Remove links
  markdown = markdown.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Remove blockquotes
  markdown = markdown.replace(/^\s*>.*$/gm, "");

  // Remove unordered lists
  markdown = markdown.replace(/^\s*-\s+(.*)$/gm, "$1");

  // Remove ordered lists
  markdown = markdown.replace(/^\s*\d+\.\s+(.*)$/gm, "$1");

  // Remove horizontal rules
  markdown = markdown.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // Remove code blocks
  markdown = markdown.replace(/```[\s\S]*?```/g, "");

  // Remove tables
  markdown = markdown.replace(/(\|.*\|.*\|\n\|.*\|.*\|\n)(\|.*\|.*\|\n)+/g, "");

  // Remove inline LaTeX expressions
  markdown = markdown.replace(/\\\((.*?)\\\)/g, "");

  // Remove formulas
  markdown = markdown.replace(/\$\$\n[\s\S]*?\n\$\$/g, "");
  markdown = markdown.replace(/\$[\S ]*?\$/g, "");

  // Remove line breaks
  markdown = markdown.replace(/\n/g, " ");

  // Trim leading and trailing whitespace
  markdown = markdown.trim();

  return markdown;
}

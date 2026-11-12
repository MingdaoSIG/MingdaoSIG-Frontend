import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { issueReportHref } from "@/modules/issueReports";
// Utils
import useIsMobile from "@/utils/useIsMobile";
import styles from "./NotFound.module.scss";

export function NotFound({
  code,
  content,
  image,
  button,
  report = true,
}: {
  code?: {
    show?: boolean;
    message?: string;
  };
  content?: {
    show?: boolean;
    message?: string;
  };
  image?: {
    show?: boolean;
    src?: string;
    width?: number;
    height?: number;
    alt?: string;
  };
  button?: {
    show?: boolean;
    message?: string;
    href?: string;
  };
  /** A small 「回報問題」 link under the button. */
  report?: boolean;
}) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const reportLink = report ? (
    <Link
      href={issueReportHref({ from: pathname })}
      className="text-ink-500 text-sm underline-offset-2 hover:text-brand-700 hover:underline"
    >
      回報問題
    </Link>
  ) : null;

  const defaultCode = {
    show: true,
    message: "404",
  };
  code = { ...defaultCode, ...code };

  const defaultContent = {
    show: true,
    message: "找不到這個頁面",
  };
  content = { ...defaultContent, ...content };

  const defaultImage = {
    show: true,
    src: "/images/404.svg",
    width: 189,
    height: 200,
    alt: "404",
  };
  image = { ...defaultImage, ...image };

  const defaultButton = {
    show: true,
    message: "回到首頁",
    href: "/",
  };
  button = { ...defaultButton, ...button };

  return isMobile ? (
    <div className={styles.mobileNotFound}>
      {image.show && image.src && image.height && image.width && image.alt && (
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          className={styles.image}
        />
      )}
      <div>
        {code.show && code.message && <h2>{code.message}</h2>}
        {content.show && content.message && <h1>{content.message}</h1>}
      </div>
      {button.show && button.href && button.message && (
        <Link href={button.href} className={styles.mobileBackToHome}>
          {button.message}
        </Link>
      )}
      {reportLink}
    </div>
  ) : (
    <div className={styles.notFound}>
      {image.show && image.src && image.height && image.width && image.alt && (
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          className={styles.image}
        />
      )}
      <div>
        {code.show && code.message && <h2>{code.message}</h2>}
        {content.show && content.message && <h1>{content.message}</h1>}
      </div>
      {button.show && button.href && button.message && (
        <Link href={button.href} className={styles.backToHome}>
          {button.message}
        </Link>
      )}
      {reportLink}
    </div>
  );
}

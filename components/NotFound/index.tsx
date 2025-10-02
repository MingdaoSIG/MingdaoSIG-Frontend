import styles from "./NotFound.module.scss";
import Link from "next/link";
import Image from "next/image";

// Utils
import useIsMobile from "@/utils/useIsMobile";

export function NotFound({
  code,
  content,
  image,
  button,
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
}) {
  const isMobile = useIsMobile();

  const defaultCode = {
    show: true,
    message: "404",
  };
  code = { ...defaultCode, ...code };

  const defaultContent = {
    show: true,
    message: "Page Not Found",
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
    message: "Bact To Home",
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
    </div>
  );
}

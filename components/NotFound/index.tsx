import styles from "./NotFound.module.scss";
import Link from "next/link";
import Image from "next/image";

export function NotFound({
  code,
  message,
  image,
  button
}: {
  code?: string;
  message?: string;
  image?: {
    show?: boolean;
    src?: string;
    width?: number;
    height?: number;
    alt?: string;
  }
  button?: {
    show?: boolean;
    message?: string;
    href?: string;
  }
}) {
  if (!code) code = "404";
  if (!message) message = "Page Not Found";

  const defaultImage = {
    show: true,
    src: "/images/404.svg",
    width: 189,
    height: 200,
    alt: "404"
  };
  image = { ...defaultImage, ...image };

  const defaultButton = {
    show: true,
    message: "Go Home",
    href: "/"
  };
  button = { ...defaultButton, ...button };

  return (
    <div className={styles.notFound}>
      {
        image?.show &&
        image.src &&
        image.height &&
        image.width &&
        image.alt && (
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={image.alt}
            className={styles.image}
          />
        )
      }
      <div>
        <h2>{code}</h2>
        <h1>{message}</h1>
      </div>
      {
        button.show &&
        button.href &&
        button.message && (
          <Link href={button.href} className={styles.backToHome}>
            {button.message}
          </Link>
        )
      }
    </div>
  );
}
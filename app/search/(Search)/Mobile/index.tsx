"use client";

// Styles
import styles from "./index.module.scss";

// Modules
import Image from "next/image";
import Link from "next/link";

export default function Mobile() {
  const image = {
    show: true,
    src: "/images/404.svg",
    width: 189,
    height: 200,
    alt: "404"
  };

  return (
    <div className={styles.mobileNotFound}>
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt={image.alt}
        className={styles.image}
      />
      <div>
        <h2>503</h2>
        <h1>Not yet for mobile</h1>
      </div>
      <Link href={"/"} className={styles.mobileBackToHome}>
        Back To Home
      </Link>

    </div>
  );
}
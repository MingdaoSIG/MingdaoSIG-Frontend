// Styles
import styles from "./index.module.scss";

// Modules
import Link from "next/link";

export default function Desktop() {
  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          <p>
            <h1 className={styles.links}>常用連結</h1>
            <Link href="/post/652cabdb45c0be8f82c54d9a">Rule</Link>
            <br />
            <Link href="/post/65325fce0b891d1f6b5b3131">About</Link>
            <br />
            <Link href="/post/652cabdb45c0be8f82c54d9a">Markdown Tourist</Link>

            <h1 className={styles.links2}>聯絡我們</h1>
            <Link href="mailto:mdsig20@ms.mingdao.edu.tw" target="_blank">Email</Link>
            <br />
            <Link href="https://www.instagram.com/mdsig.dev" target="_blank">Instagram</Link>

            <h1 className={styles.links2}>回報錯誤</h1>
            <Link href="https://forms.gle/ADMk67dcTURxjn979" target="_blank">Join Us</Link>
            <br />
            <Link href="https://forms.gle/QJbcdvTvfcFkNJ1PA" target="_blank">MDSIG 2.0 Report</Link>

            <h1 className={styles.links2}>小小彩蛋</h1>
            <Link href="/images/banner.png" target="_blank">Banner</Link>
            <br />
            <Link href="/videos/sig.mp4" target="_blank">Dynamic Banner</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
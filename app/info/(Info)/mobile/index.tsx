// Styles
import styles from "./index.module.scss";

// Modules
import { MdPreview } from "md-editor-rt";

export default function Mobile() {
  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          {/* <MdPreview
            modelValue="rule"
            previewTheme="github"
          /> */}
        </div>
      </div>
    </div>
  );
}
"use client";

import { MdPreview } from "md-editor-rt";
import styles from "./Rules.module.scss";
import "md-editor-rt/lib/preview.css";

export default function Rules() {
  const rules =
    "# MDSIG 2.0 Platform Rules \n\n ## [平台置頂]\n誠摯歡迎使用者們來到SIG 2.0共學平台，在這個資訊化時代，您將有機會在此與來自各個領域的同學一起學習並成長。\n\n此平台提供無限可能，幫助我們探索未知領域，拓展視野，掌握領域發展的趨勢與展望。\n\n共學平台創設之核心價值在於「分享」，期許每個人都能踴躍發表自己的想法及意見。除了SIG成員在此分享前瞻議題外，經驗豐富的師長、學長姐們也將提供專業的資訊及建議，值得關注與期待！\n\n鼓勵您提問、參與討論並發表意見，藉由積極參與，讓這個共學平台更多元，更豐富精彩。\n\nSIG 2.0平台團隊敬上 2023/9/22\n\n## [平台獎勵與停權辦法]\n⭕️ For SIG\n優秀SIG（發文數量、品質/按讚留言數）社群，其banner將給予奬章，以資鼓勵。\n\n⭕️ For SIG leaders/members\n優秀SIG成員（發文數量、品質/按讚留言數）\n第1~ 3名7-11禮卷500+獎狀\n前4～10名7-11禮卷200+獎狀\n前11～20名禮卷100+獎狀\n\n⭕️ For 學生/師長（非sig members）\n互動貢獻度前3名者（按讚數最高）\n頒發7-11禮卷200 + 獎狀\n4～18名 禮券100 +獎狀\n\n✔️ 貼文排序原則\n貼文瀏覽次數（以停留在文章30秒計算為觀看一次）50%\n按讚25%\n留言25%\n\n❌ 禁止暴力、血腥、色情、恐怖、有害兒少身心健康之討論；若違反以上規範禁言兩週；違反版規達三次者，永久不得發表貼文";

  return (
    <div className="h-[65dvh] w-[90dvw] mx-auto flex flex-col ">
      <div className="bg-white bg-opacity-50 rounded-[30px]">
        <MdPreview modelValue={rules} className={styles.md} />
      </div>
    </div>
  );
}

import type { FaqGroup, FaqItem } from "./types";

// 常見問題 (/about/faq), grouped. Anchors are `#q-<id>`.

export const USER_FAQ: FaqGroup[] = [
  {
    id: "account",
    title: "帳號與登入",
    items: [
      {
        id: "login-fail",
        q: "登入時出現「登入失敗」？",
        a: [
          "MDSIG 只能用學校的 Google 帳號登入，信箱結尾是 **@ms.mingdao.edu.tw**。如果瀏覽器記住了其他帳號，在 Google 的選擇帳號畫面改選學校帳號。",
          "用學校帳號還是登不進去，請[回報問題](/report?category=account&from=/about/faq)，或寄信到 [mdsig20@ms.mingdao.edu.tw](mailto:mdsig20@ms.mingdao.edu.tw)。",
        ],
      },
      {
        id: "change-name",
        q: "姓名、班級可以自己改嗎？",
        a: [
          "姓名、班級和學號每次登入時都由學校系統更新，不能自己修改。個人簡介可以在個人頁面按「編輯個人簡介」修改。",
        ],
      },
      {
        id: "suspended",
        q: "我被禁言或停權了，會怎麼樣？",
        a: [
          "被禁言時還是可以看貼文、檢舉、收藏和寫草稿，但不能發文、編輯貼文、留言、按讚、申請加入 SIG、報名活動或寫老師回饋。網站上方會寫到什麼時候、原因是什麼，時間到會自動解除。",
          "被停權則不能登入。對處理有疑問，請寄信到 [mdsig20@ms.mingdao.edu.tw](mailto:mdsig20@ms.mingdao.edu.tw)。",
        ],
      },
    ],
  },
  {
    id: "posting",
    title: "發文",
    items: [
      {
        id: "post-button",
        q: "發文按鈕沒有反應怎麼辦？",
        a: [
          "「＋」會打開編輯器。按了沒反應，先重新整理頁面；手機上的 MDSIG 停在舊版本時，把它關掉再打開。",
          "按「發布」沒反應，看看欄位下方有沒有紅字：標題、內文或 SIG 沒填，沒登入時會提醒你先登入。還是不行，請[回報問題](/report?category=bug&from=/about/faq)並附上截圖。",
        ],
      },
      {
        id: "no-sig-to-post",
        q: "「發布到」沒有可以選的 SIG？",
        a: [
          "你只能在自己加入或擔任幹部的 SIG 發文，所以要先加入一個 SIG，看[加入／追蹤 SIG](/about/guide/join)。只追蹤 SIG 不能在那裡發文。",
        ],
      },
      {
        id: "draft-where",
        q: "寫到一半的文章在哪裡？",
        a: [
          "登入時，編輯器會自動存到雲端草稿（最多 20 份）。在編輯器按「草稿」，或到「我的」→「草稿」，選「繼續編輯」。",
          "沒登入時寫的內容只存在這台裝置的瀏覽器裡，登入後會問你要不要上傳。",
        ],
      },
      {
        id: "edit-delete",
        q: "怎麼修改或刪除自己的貼文？",
        a: [
          "打開貼文：電腦版按文章下方的鉛筆（編輯貼文）或垃圾桶（刪除貼文）；手機版按右上角的「⋯」，選「編輯貼文」或「刪除貼文」。刪除後無法復原。",
        ],
      },
      {
        id: "image-upload",
        q: "圖片上傳失敗？",
        a: [
          "圖片要是 JPG、PNG、WebP 或 TIFF，每張 5 MB 以內。太大的照片先縮小再上傳。",
        ],
      },
    ],
  },
  {
    id: "sig",
    title: "SIG",
    items: [
      {
        id: "how-join",
        q: "怎麼加入 SIG？",
        a: [
          "在「探索」點 SIG 打開它的頁面，按「申請加入」，回答問題後按「送出申請」。幹部審核後會通知你。詳細步驟看[加入／追蹤 SIG](/about/guide/join)。",
        ],
      },
      {
        id: "follow-vs-join",
        q: "追蹤和加入有什麼不一樣？",
        a: [
          "追蹤：不用審核，SIG 的新貼文會出現在首頁的「我的 SIG」，隨時可以取消。",
          "加入：要申請、由幹部審核。成為成員後可以在 SIG 發文、在 SIG 頁面看到「下一個活動」，也會收到 SIG 的活動與廣播通知。",
        ],
      },
      {
        id: "join-no-result",
        q: "申請加入很久都沒有結果？",
        a: [
          "SIG 頁面的按鈕還是「審核中」，表示幹部還沒審核，可以直接問幹部。審核後會同時發通知和 Email；沒收到推播的話，看看「通知設定」的「我的入社申請有結果」有沒有打開。",
        ],
      },
      {
        id: "join-closed",
        q: "按鈕顯示「暫停招生」？",
        a: [
          "這個 SIG 現在沒有開放申請，或已經過了收件截止。可以先按「追蹤」，等 SIG 重新開放申請。",
        ],
      },
      {
        id: "leave-sig",
        q: "怎麼退出 SIG？",
        a: [
          "在 SIG 頁面按「你是這個 SIG 的成員」旁的「⋯」，選「退出 SIG」。退出後要再加入，需要重新申請。",
        ],
      },
    ],
  },
  {
    id: "events",
    title: "活動",
    items: [
      {
        id: "event-full",
        q: "活動顯示「名額已滿」或「報名已截止」？",
        a: [
          "名額已滿表示報名人數到上限了；報名已截止表示 SIG 關閉了報名。有人取消時名額會釋出，也可以問 SIG 幹部。",
        ],
      },
      {
        id: "event-cancel",
        q: "報名後不能去怎麼辦？",
        a: [
          "在活動卡片上按「取消報名」，名額會留給其他人。「我的」→「活動報名」列出你報名過的活動。",
        ],
      },
    ],
  },
  {
    id: "notifications",
    title: "通知",
    items: [
      {
        id: "no-push",
        q: "為什麼收不到推播通知？",
        a: [
          "推播要在每台裝置各自開啟：到「通知設定」按「開啟瀏覽器通知」或「開啟手機通知」。也看看「要通知我的事」裡那一種通知有沒有打開。",
          "顯示「你已封鎖 MDSIG 的通知」，要到瀏覽器的網站設定改回允許。網站裡的「通知」不受影響，一定看得到。",
        ],
      },
      {
        id: "ios-push",
        q: "iPhone 怎麼收到通知？",
        a: [
          "iPhone、iPad 要先把 MDSIG 加到主畫面：用 Safari 打開 MDSIG，點「分享」，選「加入主畫面」，再從主畫面打開 MDSIG，到通知設定按「開啟手機通知」。需要 iOS 16.4 以上。",
        ],
      },
    ],
  },
  {
    id: "other",
    title: "其他",
    items: [
      {
        id: "portfolio-pdf",
        q: "學習歷程怎麼存成 PDF？",
        a: [
          "在「學習歷程」勾選要收錄的內容，按「下載 PDF」，在列印視窗的目的地選「另存為 PDF」。",
        ],
      },
      {
        id: "report-content",
        q: "看到不當的貼文或留言？",
        a: [
          "在貼文的「⋯」選「檢舉貼文」，或在留言上按「檢舉」，選原因後送出，管理員會處理，處理完會通知你。網站本身的錯誤請用[回報問題](/about/report)。",
        ],
      },
    ],
  },
];

export function allUserFaq(): FaqItem[] {
  return USER_FAQ.flatMap((group) => group.items);
}

export function userFaqItems(ids: string[]): FaqItem[] {
  const all = allUserFaq();
  return ids.flatMap((id) => all.filter((item) => item.id === id));
}

/** The questions 開始使用 shows. */
export const FAQ_HIGHLIGHTS = [
  "post-button",
  "how-join",
  "follow-vs-join",
  "no-push",
  "draft-where",
];

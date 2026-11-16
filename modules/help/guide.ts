import { helpImage } from "./image";
import {
  EVENT_MANAGE_STEPS,
  FEEDBACK_STEPS,
  JOIN_REVIEW_STEPS,
  SIG_MANAGE_STEPS,
} from "./shared";
import type { GuideTopic } from "./types";

// 使用教學 (/about/guide, decision 2C): illustrated steps for every topic.
// Button names are written exactly as the site shows them.

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "first-use",
    title: "第一次使用",
    audience: "everyone",
    summary: "用學校信箱登入，選幾個有興趣的 SIG，就能開始逛。",
    minutes: 2,
    steps: [
      {
        text: "按右上角的「登入」，用學校的 Google 帳號（**@ms.mingdao.edu.tw**）登入。用其他信箱會看到「登入失敗」。",
        image: helpImage("login", "網站右上角的登入按鈕"),
      },
      {
        text: "第一次登入會出現三個步驟。先在「選擇你有興趣的 SIG」點幾個 SIG，按「追蹤 N 個 SIG」。追蹤不是加入，隨時可以取消。",
        image: helpImage("onboarding", "第一次登入的選擇 SIG 畫面"),
      },
      {
        text: "接著「開啟通知」：按「開啟瀏覽器通知」（手機是「開啟手機通知」），有人回覆你、申請有結果時就會通知你。現在不想設定，按「略過」。",
      },
      {
        text: "最後按「開始使用」。首頁的「我的 SIG」會先顯示你追蹤和加入的 SIG 的新貼文，「最新」和「熱門」看全站。",
        image: helpImage("home", "首頁，上方有我的 SIG、最新、熱門分頁"),
      },
      {
        text: "電腦版左側是導覽列：首頁、探索、通知、我的、平台資訊，下面是你的 SIG，最下方藍色的「＋」用來發文。手機版在下方：首頁、探索、＋、通知、我的。",
      },
    ],
    tips: [
      "沒有出現這三個步驟，表示已經設定過了。之後可以到「探索」追蹤 SIG，到「通知設定」開啟通知。",
    ],
    faq: ["login-fail", "change-name"],
  },
  {
    id: "post",
    title: "發文與編輯器",
    audience: "everyone",
    summary: "寫標題與內文、選 SIG 和封面，按「發布」。",
    minutes: 3,
    tour: "post",
    steps: [
      {
        text: "按左側導覽列最下方的「＋」（手機是下方中間的「＋」），打開編輯器。",
        image: helpImage("new-post", "左側導覽列最下方的＋發文按鈕"),
      },
      {
        text: "在「標題」寫主題，下面寫內文。工具列有粗體、標題、清單、程式碼、連結、圖片和表格；圖片也能直接貼上或拖曳進來，每張 5 MB 以內。",
        image: helpImage(
          "editor",
          "編輯器：標題、工具列、內文與右邊的即時預覽",
        ),
      },
      {
        text: "上方可以切換「寫作」「並排」「預覽」，並排時右邊就是發布後的樣子。內文用 Markdown 寫，不熟的話看 [Markdown 教學](/post/652e4591d04b679afdff697e)。",
      },
      {
        text: "在右邊的設定選「發布到」哪個 SIG，再設「封面」（不換就用「SIG 預設封面」）、「標籤」（最多 5 個，按 Enter 或逗號加入），也可以「加入系列」。設定收起來時，按上方的「設定」打開。手機按「發布」會先打開「發布設定」。",
        image: helpImage(
          "editor-settings",
          "發布設定：發布到、封面、標籤與加入系列",
        ),
      },
      {
        text: "按「發布」。少了標題、內文或 SIG，欄位下方會提醒你。發布成功後按「查看貼文」。",
      },
      {
        text: "登入時，寫到一半會自動存到雲端，上方顯示「已儲存到雲端 hh:mm」。按「草稿」可以接著寫之前的草稿，最多 20 份。",
      },
      {
        text: "要修改或刪除，打開自己的貼文：電腦版按文章下方的鉛筆（編輯貼文）或垃圾桶（刪除貼文）；手機版按右上角的「⋯」。",
      },
    ],
    tips: [
      "你可以在自己加入或擔任幹部的 SIG 發文；指導老師可以在每個 SIG 發文。「公告」只開放給管理員。",
      "沒登入也可以先寫，草稿會存在這台裝置，登入後就能發布。",
    ],
    faq: ["post-button", "no-sig-to-post", "draft-where", "edit-delete"],
  },
  {
    id: "join",
    title: "加入／追蹤 SIG",
    audience: "everyone",
    summary: "追蹤只看貼文，加入要申請、由幹部審核。",
    minutes: 2,
    tour: "join",
    steps: [
      {
        text: "到「探索」看所有 SIG。「正在招生」列出現在開放申請的 SIG 和截止日期。",
        image: helpImage("explore", "探索頁：搜尋、正在招生與全部 SIG"),
      },
      {
        text: "只想看貼文，按 SIG 卡片上的「追蹤」，新貼文會出現在首頁的「我的 SIG」。按「已追蹤」可以取消。",
      },
      {
        text: "想加入，點 SIG 名稱打開 SIG 頁面，按「申請加入」。",
        image: helpImage("sig-join", "SIG 頁面右邊的申請加入與追蹤按鈕"),
      },
      {
        text: "回答 SIG 的問題（標「必填」的一定要回答，每題最多 500 字），按「送出申請」。",
        image: helpImage(
          "join-dialog",
          "申請加入視窗，列出 SIG 的問題與送出申請按鈕",
        ),
      },
      {
        text: "送出後按鈕會變成「審核中」。幹部審核後，你會收到通知「你的入社申請已通過」或「你的入社申請沒有通過」，也會收到 Email。沒通過可以「再次申請」。",
      },
      {
        text: "加入後，SIG 頁面會顯示「你是這個 SIG 的成員」。要退出，按旁邊的「⋯」選「退出 SIG」；之後要再加入，需要重新申請。",
      },
    ],
    tips: [
      "按鈕顯示「暫停招生」，表示 SIG 現在沒有開放申請。可以先追蹤，等重新開放。",
    ],
    faq: ["follow-vs-join", "join-no-result", "join-closed"],
  },
  {
    id: "events",
    title: "活動報名",
    audience: "everyone",
    summary: "在「活動」頁找到社課與活動，按「報名」。",
    minutes: 2,
    tour: "event",
    steps: [
      {
        text: "從「探索」的「近期活動」按「查看全部」，或到「我的」→「活動報名」，打開「活動」頁。",
        image: helpImage("events", "活動頁：上方的篩選與活動列表"),
      },
      {
        text: "上方選「我的 SIG」「全部」或「已報名」；按「月曆」用月曆看。電腦寬螢幕會把列表和月曆並排，點日期就跳到那天。",
      },
      {
        text: "在活動卡片按「報名」。有名額限制的活動會顯示「已報名 12 / 30 人」，額滿時按鈕變成「名額已滿」。",
        image: helpImage("event-rsvp", "活動卡片上的報名按鈕與報名人數"),
      },
      {
        text: "報名後會顯示「已報名」，不能去了就按「取消報名」。",
      },
      {
        text: "按「加到 Google 日曆」或「下載 .ics」，把活動放進行事曆。",
      },
    ],
    tips: [
      "SIG 頁面的「活動」分頁也能報名；成員在 SIG 頁面會看到「下一個活動」。",
    ],
    faq: ["event-full", "event-cancel"],
  },
  {
    id: "notifications",
    title: "通知與推播",
    audience: "everyone",
    summary: "選要收到哪些通知，在手機或電腦開啟推播，iPhone 先加到主畫面。",
    minutes: 3,
    steps: [
      {
        text: "電腦版按左側的「通知」，右邊會打開通知面板；手機版按下方的「通知」。有未讀時會顯示數字。",
        image: helpImage("notifications", "通知面板，依今天、本週、更早分組"),
      },
      {
        text: "上方可以篩選「全部」「未讀」「互動」「SIG」，按「全部標為已讀」清掉未讀。",
      },
      {
        text: "按「通知設定」（面板上的齒輪），在「要通知我的事」選要收到哪些通知，開關一按就生效。Email 可以設定「有人留言時寄信通知我」和「每週摘要」。",
        image: helpImage(
          "notification-settings",
          "通知設定視窗，列出每種通知的開關",
        ),
      },
      {
        text: "沒開著 MDSIG 也想收到通知，在「這台裝置的通知」按「開啟瀏覽器通知」（手機是「開啟手機通知」），再允許瀏覽器的通知。每台裝置要各自開啟。",
      },
      {
        text: "iPhone、iPad 要先把 MDSIG 加到主畫面：用 Safari 打開 MDSIG，點畫面下方的「分享」，選「加入主畫面」再點「新增」。然後從主畫面打開 MDSIG，按「開啟手機通知」。需要 iOS 16.4 以上。",
      },
      {
        text: "Android 和電腦的 Chrome、Edge，通知設定裡會出現「安裝 MDSIG」，按「安裝」就能像 App 一樣從主畫面或桌面打開。",
      },
    ],
    tips: [
      "看到「你已封鎖 MDSIG 的通知」，要到瀏覽器的網站設定，把通知改回允許。",
    ],
    faq: ["no-push", "ios-push"],
  },
  {
    id: "portfolio",
    title: "學習歷程",
    audience: "everyone",
    summary: "把貼文、SIG 經歷和老師回饋整理成 A4，下載 PDF。",
    minutes: 2,
    steps: [
      {
        text: "到「我的」→「學習歷程」，或在自己的個人頁面按「學習歷程」旁的「查看」。",
      },
      {
        text: "左邊的「收錄內容」勾選要放進去的部分：基本資料、SIG 與幹部經歷、文章、老師回饋、數據。文章可以展開，一篇一篇選。預設全部收錄。",
        image: helpImage(
          "portfolio",
          "學習歷程：左邊勾選收錄內容，右邊是 A4 預覽",
        ),
      },
      {
        text: "右邊是 A4 預覽，勾選後馬上更新。手機版用上方的「選擇內容」和「預覽」切換。",
      },
      {
        text: "按「下載 PDF」，在列印視窗選「另存為 PDF」。",
      },
    ],
    faq: ["portfolio-pdf"],
  },
  {
    id: "me",
    title: "個人專區",
    audience: "everyone",
    summary: "我的 SIG、草稿、收藏、數據和設定都在這裡。",
    minutes: 2,
    steps: [
      {
        text: "手機版按下方的「我的」；電腦版按右上角的頭像，打開個人專區選單。",
        image: helpImage(
          "me",
          "個人專區：我的 SIG、活動報名、草稿、收藏等入口",
        ),
      },
      {
        text: "這裡有「我的 SIG」「活動報名」「草稿」「收藏」「按讚」「系列」「學習歷程」「數據」「通知設定」「我的回報」和「平台資訊」。",
      },
      {
        text: "按「查看我的個人頁面」打開你的個人頁面，別人看到的就是這一頁：貼文、系列、SIG 和徽章。",
        image: helpImage("profile", "自己的個人頁面，右邊有編輯個人簡介按鈕"),
      },
      {
        text: "在個人頁面按「編輯個人簡介」寫一段自我介紹，按「儲存」。",
      },
      {
        text: "個人頁面的「按讚過的貼文」「收藏」「我的數據」只有你看得到。「我的數據」有每篇貼文的瀏覽數。",
      },
      {
        text: "要登出，在選單或「我的」最下方按「登出」。",
      },
    ],
    faq: ["change-name"],
  },
  {
    id: "report",
    title: "回報問題",
    audience: "everyone",
    summary: "網站有錯、想提建議或帳號有問題，都可以回報。",
    minutes: 2,
    steps: [
      {
        text: "到[回報問題](/about/report)選「回報錯誤」「提出建議」或「帳號問題」，或從頭像選單按「回報問題」。需要先登入。",
        image: helpImage(
          "about-report",
          "說明中心的回報問題：三種類型與我的回報",
        ),
      },
      {
        text: "寫「標題」和「說明」：在哪一頁、做了什麼、看到什麼。說明最多 2000 字。",
      },
      {
        text: "可以加入最多 3 張截圖，直接貼上或拖曳也可以，每張 5 MB 以內。",
        image: helpImage("report-form", "回報問題表單：類型、標題、說明與截圖"),
      },
      {
        text: "「會一起送出的資訊」會附上目前頁面、版本、瀏覽器和螢幕大小，幫我們找到問題。按「送出回報」。",
      },
      {
        text: "到「我的」→「我的回報」看處理進度：待處理、處理中、已解決、不處理。管理員回覆或處理完時，你會收到通知。",
      },
    ],
    tips: ["一小時內最多回報 5 次。"],
    faq: ["report-content"],
  },
  {
    id: "join-review",
    title: "審核入社申請",
    audience: "managers",
    summary: "在通知或管理平台同意、拒絕入社申請。",
    minutes: 2,
    steps: JOIN_REVIEW_STEPS,
  },
  {
    id: "events-manage",
    title: "建立活動與查看報名",
    audience: "managers",
    summary: "新增社課或活動，看報名名單、匯出 Excel。",
    minutes: 3,
    steps: EVENT_MANAGE_STEPS,
  },
  {
    id: "feedback",
    title: "寫老師回饋",
    audience: "managers",
    summary: "指導老師在學生的貼文寫回饋，只有作者看得到。",
    minutes: 1,
    steps: FEEDBACK_STEPS,
  },
  {
    id: "manage-sig",
    title: "管理 SIG",
    audience: "managers",
    summary: "簡介、招生設定、申請題目和精選成果。",
    minutes: 3,
    steps: SIG_MANAGE_STEPS,
  },
];

export function guideTopic(id: string) {
  return GUIDE_TOPICS.find((topic) => topic.id === id);
}

/** The topics most people need, for 開始使用. */
export const QUICK_TOPICS = [
  "first-use",
  "post",
  "join",
  "events",
  "notifications",
  "report",
];

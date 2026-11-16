import { helpImage } from "./image";
import type { HelpStep } from "./types";

// Steps that both the user help (使用教學 for SIG 幹部 and 指導老師) and
// the admin help (/admin/help, the 「？說明」 drawer) show. Written once.

export const JOIN_REVIEW_STEPS: HelpStep[] = [
  {
    text: "有人申請加入你管理的 SIG 時，你會收到通知。只有一筆時，可以直接在通知上按「同意」或「拒絕」，或按「看申請內容」。",
  },
  {
    text: "也可以按上方的「管理平台」，到「入社申請」看全部申請。預設顯示「待審核」，等最久的排在最上面。",
    image: helpImage(
      "admin-join-requests",
      "管理平台的入社申請列表，每筆有同意與拒絕按鈕",
    ),
  },
  {
    text: "看過申請人的回答後按「同意」或「拒絕」。拒絕前會再確認一次（「拒絕申請」）。",
  },
  {
    text: "結果會用通知和 Email 告訴申請人，同意後對方馬上成為成員。別的幹部已經處理過的申請，會顯示「這筆申請已經有人處理過了」。",
  },
  {
    text: "只想看一個 SIG 的申請，在 SIG 頁面按「管理這個 SIG」，打開「入社申請」分頁。",
  },
];

export const EVENT_MANAGE_STEPS: HelpStep[] = [
  {
    text: "在 SIG 頁面的「活動」分頁按「新增活動」，或在「管理這個 SIG」的「活動」分頁按「新增活動」。",
  },
  {
    text: "填「活動名稱」「開始時間」「結束時間」，「地點」和「說明」可以不填。「名額」填 0 代表不限名額；要讓成員報名，打開「開放報名」。按「建立活動」，成員會收到通知。",
    image: helpImage(
      "event-editor",
      "新增活動視窗，有活動名稱、時間、地點、名額與開放報名",
    ),
  },
  {
    text: "要修改或刪除，在活動卡片上按「編輯」或「刪除」。",
  },
  {
    text: "看誰報名：在「管理這個 SIG」的「活動」分頁點一個活動，右邊的「報名名單」列出每個人，按「匯出 Excel」下載。SIG 頁面的「報名名單」也會帶你到這裡。",
    image: helpImage(
      "admin-events",
      "管理平台的活動分頁，右邊是報名名單與匯出 Excel",
    ),
  },
];

export const FEEDBACK_STEPS: HelpStep[] = [
  {
    text: "打開學生的貼文，往下捲到留言上方的「老師回饋」。",
  },
  {
    text: "在「寫給作者的回饋」寫下回饋（最多 1000 字），按「送出回饋」，作者會收到通知。",
    image: helpImage(
      "teacher-feedback",
      "貼文下方的老師回饋區，有輸入框與送出回饋按鈕",
    ),
  },
  {
    text: "回饋只有作者、這篇貼文所屬 SIG 的指導老師和管理員看得到，SIG 幹部和其他同學看不到。",
  },
  {
    text: "自己寫的回饋可以修改；寫的人或管理員可以刪除。作者的學習歷程也會收錄老師回饋。",
  },
];

export const SIG_MANAGE_STEPS: HelpStep[] = [
  {
    text: "在 SIG 頁面按「管理這個 SIG」，或從「管理平台」→「SIG」點你的 SIG。",
    image: helpImage("admin-sig", "管理平台的 SIG 基本資料分頁"),
  },
  {
    text: "「基本資料」可以換頭像、改「簡介」（250 字以內），按「儲存變更」。SIG 名稱、網址、代表色和預設封面只有管理員能改。",
  },
  {
    text: "「招生設定」切換「招生中」或「暫停招生」，寫「招生說明」、設「收件截止」，再編輯「申請題目」（最多 5 題，每題 60 字以內，可以設必填）。按「儲存招生設定」；旁邊會即時預覽申請者看到的樣子。",
    image: helpImage(
      "admin-recruiting",
      "招生設定分頁：招生狀態、說明、截止時間與申請題目",
    ),
  },
  {
    text: "「基本資料」下方的「精選成果」最多挑 6 篇這個 SIG 的代表作，排好順序後按「儲存精選」，會顯示在 SIG 頁面上。",
  },
  {
    text: "「成員」可以搜尋、「下載 Excel」或把人「移出」；「數據」看每月新成員、貼文與熱門貼文。",
  },
  {
    text: "要通知所有成員，按上方的「通知成員」。新增或移除幹部、指導老師，要請管理員操作。",
  },
];

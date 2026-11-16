import type { AdminRole } from "@/utils/useAdminAccess";
import {
  EVENT_MANAGE_STEPS,
  JOIN_REVIEW_STEPS,
  SIG_MANAGE_STEPS,
} from "./shared";
import type { AdminGuide } from "./types";

// 說明與教學 (/admin/help, decision 4C): one guide per admin feature, with
// the roles that can use it (the same roles as the sidebar sections in
// app/admin/(admin)/config.ts). The 「？說明」 drawer shows the first
// `short` steps of the page's guide. Rules follow the backend on
// origin/development and design/api-contract-v4.md.

const ALL: AdminRole[] = ["admin", "moderator", "manager"];
const MODERATION: AdminRole[] = ["admin", "moderator"];
const MANAGERS: AdminRole[] = ["admin", "manager"];
const ADMIN: AdminRole[] = ["admin"];

export const ADMIN_GUIDES: AdminGuide[] = [
  {
    id: "overview",
    title: "總覽",
    group: "開始",
    roles: ALL,
    href: "/admin",
    summary: "今天要處理的事：待處理檢舉、待審入社申請和需要設定的 SIG。",
    short: 3,
    steps: [
      {
        text: "管理員會看到使用者、貼文、留言的數字（含「近 7 天 +N」）、「待審入社申請」和「待處理檢舉」，下方的「待處理」列出要處理的事，按「處理」「審核」或「設定」直接前往。",
        roles: ADMIN,
      },
      {
        text: "「最新貼文」列出剛發的貼文，下方是「網站流量」。",
        roles: ADMIN,
      },
      {
        text: "內容管理員只會看到貼文、留言和「待處理檢舉」三個數字。",
        roles: ["moderator"],
      },
      {
        text: "SIG 幹部與指導老師會看到「待審入社申請」（按「全部申請」看全部）和「我管理的 SIG」。",
        roles: ["manager"],
      },
      {
        text: "數字每分鐘更新一次，待處理檢舉的數字是即時的。左側欄的數字標示也會提醒待審的申請、檢舉與問題回報。",
      },
    ],
  },
  {
    id: "posts",
    title: "貼文",
    group: "內容",
    roles: MODERATION,
    href: "/admin/posts",
    summary: "找貼文、置頂、下架與復原，管理員還能搬移到其他 SIG。",
    short: 3,
    steps: [
      {
        text: "用上方的搜尋（標題或作者）、SIG、狀態（公開中／置頂／已下架／全部）和排序找到貼文。點一列打開右邊的詳細資料。",
      },
      {
        text: "勾選多篇貼文，上方會出現「已選 N 篇」，可以一次「置頂」「取消置頂」「下架」或「復原」，一次最多 100 篇。",
      },
      {
        text: "「下架」會讓貼文從網站上消失，但不會真的刪掉：狀態選「已下架」就能找到並按「復原」。下架不會通知作者。",
      },
      {
        text: "管理員可以「搬移到其他 SIG」：選目的 SIG → 預覽 → 「確定搬移 N 篇」。篩選單一 SIG 時，也能搬移那個 SIG 的全部貼文。作者、讚和留言都會保留，用舊 SIG 預設封面的貼文會換成新 SIG 的。",
        roles: ADMIN,
      },
    ],
    faq: ["remove-undo"],
  },
  {
    id: "comments",
    title: "留言",
    group: "內容",
    roles: MODERATION,
    href: "/admin/comments",
    summary: "搜尋留言、刪除與復原。",
    short: 2,
    steps: [
      {
        text: "用「搜尋留言內容…」和狀態（顯示中／已刪除／全部）找留言。從貼文或使用者打開時，上方會有「貼文：…」或「作者：…」的篩選。",
      },
      {
        text: "按「刪除」並確認。刪除的留言可以在「已刪除」裡按「復原」。刪除不會通知留言的人。",
      },
    ],
    faq: ["remove-undo"],
  },
  {
    id: "reports",
    title: "檢舉",
    group: "內容",
    roles: MODERATION,
    href: "/admin/reports",
    summary: "看檢舉內容與理由，「移除內容」或「不處理」。",
    short: 3,
    steps: [
      {
        text: "預設顯示「待處理」，最早的在最上面。可以用類型（貼文／留言）篩選。點一筆看檢舉理由、補充說明和被檢舉的內容。",
      },
      {
        text: "按「移除內容」下架那則貼文或留言，或按「不處理」保留它。可以寫「處理說明」（300 字以內），會留在處理紀錄裡。",
      },
      {
        text: "同一則內容的所有待處理檢舉會一起結案，每位檢舉人都會收到「你的檢舉已處理」的通知。",
      },
      {
        text: "移除的內容可以在「貼文」或「留言」的已下架、已刪除裡復原。檢舉人寫成「系統（關鍵字）」的，是關鍵字過濾自動送出的檢舉。",
      },
    ],
    faq: ["duplicate-reports", "remove-undo"],
  },
  {
    id: "keyword-filter",
    title: "關鍵字過濾",
    group: "內容",
    roles: ADMIN,
    href: "/admin/keyword-filter",
    summary: "含有關鍵字的貼文和留言會自動送進檢舉。",
    short: 2,
    steps: [
      {
        text: "在「新增關鍵字」輸入後按 Enter 或「加入」；一次貼上多個，用換行或逗號分開。按「儲存」才會生效。",
      },
      {
        text: "最多 200 個關鍵字，每個 1–30 字，不分大小寫，重複的會自動去掉。",
      },
      {
        text: "新發或修改的貼文（標題、內文、標籤）和留言含有關鍵字時，會以「系統（關鍵字）」送出一筆檢舉，到「檢舉」處理。貼文照常發布，不會被擋下。",
      },
    ],
    faq: ["keyword-not-block"],
  },
  {
    id: "sig-settings",
    title: "SIG：基本資料與精選成果",
    group: "社群",
    roles: MANAGERS,
    href: "/admin/sigs",
    summary: "頭像、簡介、精選成果、Discord 通知、成員與數據。",
    short: 3,
    steps: [
      ...SIG_MANAGE_STEPS.slice(0, 2),
      SIG_MANAGE_STEPS[3],
      SIG_MANAGE_STEPS[4],
      {
        text: "「Discord 通知」貼上 Discord 的 Webhook 網址，按「儲存」，之後 SIG 每有新貼文就會傳到 Discord。「測試」送一則測試訊息，「清除」停用。網址儲存後不會再顯示。",
      },
      SIG_MANAGE_STEPS[5],
    ],
    faq: ["leader-archived"],
  },
  {
    id: "sig-url",
    title: "SIG：網址、代表色與封面",
    group: "社群",
    roles: ADMIN,
    href: "/admin/sigs",
    summary: "新增 SIG、改 SIG ID（網址）、代表色和預設封面。",
    short: 3,
    steps: [
      {
        text: "SIG 列表的「新增 SIG」填名稱（1–30 字）、SIG ID（網址），簡介、代表色、頭像和預設封面可以之後再補，按「建立 SIG」。",
      },
      {
        text: "在 SIG 的「基本資料」→「網址與外觀」改「SIG ID（網址）」：小寫英文、數字和底線，可以用單一的點分段，50 字以內，不能和任何使用者或 SIG 重複。",
      },
      {
        text: "改網址前會確認一次。舊網址會自動轉到新網址，但印出來的 QR code 或文件要記得更新。用過的舊網址不能再給別人用。",
      },
      {
        text: "「代表色」用在貼文列表、SIG 卡片和圖表；「預設封面」給沒有封面的貼文用，建議 16:9。",
      },
    ],
    faq: ["customid-change"],
  },
  {
    id: "sig-archive",
    title: "SIG：封存與合併",
    group: "社群",
    roles: ADMIN,
    href: "/admin/sigs",
    summary: "停用不再運作的 SIG，或把兩個 SIG 併成一個。",
    short: 3,
    steps: [
      {
        text: "在 SIG 的「基本資料」→「封存與合併」按「封存 SIG」並確認。封存後網站上看不到這個 SIG，不能再發文或申請加入；貼文和成員都會保留。",
      },
      {
        text: "要恢復：SIG 列表的「顯示」選「已封存」→ 點那個 SIG → 「恢復 SIG」。",
      },
      {
        text: "合併：按「合併 SIG」選「合併到」哪個 SIG → 「預覽合併結果」→ 「確定合併」。貼文會搬過去，成員會加入目的 SIG，待審的申請也會一起轉過去，舊網址會轉到目的 SIG，原本的 SIG 會被封存。",
      },
      {
        text: "合併不會搬移幹部和指導老師，需要的話到目的 SIG 的「幹部與老師」新增。合併無法自動復原。「公告」不能封存或合併。",
      },
    ],
    faq: ["undo-archive", "leader-archived"],
  },
  {
    id: "sig-recruiting",
    title: "SIG：招生設定與申請題目",
    group: "社群",
    roles: MANAGERS,
    href: "/admin/sigs",
    summary: "開放或暫停招生、收件截止、申請題目。",
    short: 2,
    steps: [
      SIG_MANAGE_STEPS[2],
      {
        text: "暫停招生或過了收件截止後，學生的「申請加入」會變成「暫停招生」；已經送出的申請還是可以審核。",
      },
      {
        text: "「改回預設題目」恢復三題預設：自我介紹、為什麼想加入這個 SIG、有興趣的主題。學生每題最多回答 500 字。",
      },
    ],
  },
  {
    id: "sig-staff",
    title: "SIG：幹部與指導老師",
    group: "社群",
    roles: MANAGERS,
    href: "/admin/sigs",
    summary: "由管理員新增或移除 SIG 幹部與指導老師。",
    short: 3,
    steps: [
      {
        text: "在 SIG 的「幹部與老師」分頁按「新增幹部」或「新增老師」，用姓名、帳號 ID、Email 或學號搜尋；也可以按「直接用學號／Email 新增」。",
        roles: ADMIN,
      },
      {
        text: "幹部用學號找，指導老師用 Email 找。對方要先登入過 MDSIG 一次，才找得到帳號。",
        roles: ADMIN,
      },
      {
        text: "移除時會確認一次，被移除的人不會再收到入社申請通知。新增或移除都不會通知對方，記得告訴他們。",
        roles: ADMIN,
      },
      {
        text: "幹部和指導老師可以看這份名單，但新增或移除要請管理員操作。",
        roles: ["manager"],
      },
      {
        text: "很多 SIG 一起換幹部時，用「學年交接」的「下一屆幹部」一次處理。",
        roles: ADMIN,
      },
    ],
    faq: ["make-leader"],
  },
  {
    id: "sig-events",
    title: "SIG：活動與報名名單",
    group: "社群",
    roles: MANAGERS,
    href: "/admin/sigs",
    summary: "新增活動、看報名名單、匯出 Excel。",
    short: 2,
    steps: [
      ...EVENT_MANAGE_STEPS,
      {
        text: "「活動」分頁的「顯示」可以切換「即將舉行」「已結束」和「全部」。",
      },
    ],
  },
  {
    id: "join-requests",
    title: "入社申請",
    group: "社群",
    roles: MANAGERS,
    href: "/admin/join-requests",
    summary: "審核學生的入社申請，結果會通知學生。",
    short: 3,
    steps: [
      ...JOIN_REVIEW_STEPS,
      {
        text: "管理員可以審核所有 SIG 的申請；幹部和指導老師只看得到自己管理的 SIG。SIG 沒有幹部和指導老師時，申請會通知所有管理員。",
        roles: ADMIN,
      },
    ],
    faq: ["join-no-result"],
  },
  {
    id: "users-suspension",
    title: "使用者：停權與禁言",
    group: "社群",
    roles: MODERATION,
    href: "/admin/users",
    summary: "暫時限制違規的使用者。",
    short: 3,
    steps: [
      {
        text: "在「使用者」用姓名、帳號 ID、Email 或學號找人，點一列打開詳細資料，到「停權／禁言」。",
      },
      {
        text: "選「禁言」或「停權」，選期間（1 天、3 天、7 天、30 天、無限期或自訂結束時間），寫原因（1–200 字，對方看得到），送出。",
      },
      {
        text: "對方會收到通知，網站上方也會顯示限制到什麼時候和原因；時間到會自動解除，也可以按「解除禁言」或「解除停權」。",
      },
      {
        text: "內容管理員只能禁言和解除禁言；停權只有管理員能設定或解除。任何人都不能處理自己或管理員，內容管理員之間也不能互相處理。",
      },
      {
        text: "管理員可以在「紀錄」看到這個人過去的停權與禁言。",
        roles: ADMIN,
      },
    ],
    faq: ["mute-vs-ban", "moderator-scope"],
  },
  {
    id: "users-roles",
    title: "使用者：角色與內容管理員",
    group: "社群",
    roles: ADMIN,
    href: "/admin/users",
    summary: "把使用者設成內容管理員或管理員。",
    short: 2,
    steps: [
      {
        text: "在使用者的詳細資料「角色」選「一般使用者」「內容管理員」或「管理員」，按「變更角色」並確認。",
      },
      {
        text: "內容管理員可以處理貼文、留言、檢舉，以及查看使用者和禁言；不能停權、改角色或使用其他功能。",
      },
      {
        text: "不能改自己的角色，也不能把最後一位管理員降級。變更不會通知對方。",
      },
      {
        text: "「身分」篩選選「內容管理員」或「管理員」，可以列出目前有這些角色的人。",
      },
    ],
    faq: ["moderator-scope"],
  },
  {
    id: "users-edit",
    title: "使用者：資料、徽章與登入紀錄",
    group: "社群",
    roles: ADMIN,
    href: "/admin/users",
    summary: "修改帳號 ID、顯示名稱、關於我，發徽章，看登入紀錄。",
    short: 3,
    steps: [
      {
        text: "「編輯資料」可以改「帳號 ID（個人頁面網址）」（25 字以內，舊網址會自動轉址）、「顯示名稱」（1–30 字）和「關於我」（250 字以內）。",
      },
      {
        text: "姓名、班級和學號每次登入時由學校系統更新，不能在這裡修改。",
      },
      {
        text: "「徽章」勾選要給的徽章，按「儲存徽章」。已停用的徽章不能再發，已經有的人會保留。",
      },
      {
        text: "「登入紀錄」顯示最近幾次登入，按「查看全部 N 筆」打開這個人的完整登入紀錄。",
      },
    ],
  },
  {
    id: "rollover",
    title: "學年交接",
    group: "社群",
    roles: ADMIN,
    href: "/admin/rollover",
    summary: "每學年整理畢業生、換下一屆幹部、合併與搬移。",
    short: 3,
    steps: [
      {
        text: "「1. 畢業生整理」列出還在 SIG 裡的校友，以及擔任幹部或指導老師的校友。勾選「把校友移出所有 SIG」和「移除擔任幹部或指導老師的校友」。",
      },
      {
        text: "按「檢查並套用…」先預覽會改什麼，確認無誤再按「套用」。帳號、貼文和留言都會保留，但這一步無法自動復原。",
      },
      {
        text: "「2. 下一屆幹部」逐一 SIG 新增下一屆幹部，選「取代現任」或「加入現任」→「預覽變更」→「確定套用」。一次最多 100 個 SIG、每個 SIG 20 人。",
      },
      {
        text: "預覽之後如果有 SIG 的幹部被別人改過，那個 SIG 會跳過並列出來，名單會保留，確認後再套用一次。",
      },
      {
        text: "「3. 合併與搬移」連到合併 SIG 和搬移貼文。",
      },
    ],
    faq: ["rollover-how"],
  },
  {
    id: "badges",
    title: "徽章",
    group: "社群",
    roles: ADMIN,
    href: "/admin/badges",
    summary: "建立、修改與停用個人頁面上的徽章。",
    short: 2,
    steps: [
      {
        text: "按「新增徽章」，填「代碼」（小寫英文、數字和 _ . -，30 字以內，之後不能改）、「名稱」（20 字以內）、「說明」（100 字以內）、圖示和顏色。",
      },
      {
        text: "到使用者的詳細資料「徽章」發給個人。",
      },
      {
        text: "「停用」會讓徽章從所有個人頁面上隱藏，但不會從使用者身上移除；「恢復使用」就會再出現。",
      },
    ],
  },
  {
    id: "banners",
    title: "公告橫幅",
    group: "溝通",
    roles: ADMIN,
    href: "/admin/banners",
    summary: "在網站上方顯示一則公告，可以排程。",
    short: 3,
    steps: [
      {
        text: "按「新增橫幅」，寫「內容」（1–200 字），選樣式（資訊、警告、成功），可以加連結（站內路徑在同一頁打開，https 網址開新分頁）。",
      },
      {
        text: "設「開始時間」和「結束時間」。不設結束時間就一直顯示，直到刪除。",
      },
      {
        text: "列表上的狀態：「顯示中」「排程中」「已結束」，或「被較新的橫幅蓋過」—— 同時間只會顯示最新建立的那一則。",
      },
      {
        text: "橫幅不會出現在管理平台裡。使用者按掉後，那一則就不再顯示給他，新的橫幅還是會出現。",
      },
    ],
    faq: ["banner-not-showing"],
  },
  {
    id: "broadcast",
    title: "廣播通知",
    group: "溝通",
    roles: MANAGERS,
    href: "/admin/broadcast",
    summary: "發一則通知給全站或一個 SIG 的成員。",
    short: 3,
    steps: [
      {
        text: "選「對象」：「全站所有使用者」（只有管理員能選）或「指定 SIG 的成員」。幹部和指導老師只能選自己管理的 SIG；SIG 的「通知成員」也是同一個功能。",
      },
      {
        text: "寫「標題」（60 字以內）和「內容」（300 字以內），可以加站內連結；勾選「同時推播到手機與瀏覽器」會一起推播。",
      },
      {
        text: "按「傳送…」，會先算出收件人數，確認「傳送給 N 位使用者？」後送出。傳送後不能收回。",
      },
      {
        text: "每個人一小時內最多傳送 5 則廣播。推播只會送給開了推播、而且沒有關掉「平台公告與 SIG 廣播」的人。",
      },
    ],
    faq: ["broadcast-limits"],
  },
  {
    id: "traffic",
    title: "網站流量",
    group: "溝通",
    roles: ADMIN,
    href: "/admin",
    summary: "在總覽看瀏覽次數、訪客、熱門頁面和來源。",
    short: 2,
    steps: [
      {
        text: "總覽下方的「網站流量」選 7 天、30 天或 90 天，看瀏覽次數、訪客、造訪和每日的折線圖。",
      },
      {
        text: "「熱門頁面」和「主要來源」各列前 10 名，沒有來源的寫成「直接造訪」。數字每 10 分鐘更新。",
      },
      {
        text: "流量服務沒有設定或連不上時，這張卡片不會出現。",
      },
    ],
  },
  {
    id: "issue-reports",
    title: "問題回報",
    group: "其他",
    roles: ADMIN,
    href: "/admin/issue-reports",
    summary: "處理使用者從「回報問題」送來的錯誤、建議和帳號問題。",
    short: 3,
    steps: [
      {
        text: "預設顯示「待處理＋處理中」，可以用狀態、類型和「標題或說明…」篩選。點一筆打開詳細資料。",
      },
      {
        text: "詳細資料有說明、截圖（點一下放大）、送出時的頁面、版本、瀏覽器、螢幕大小和錯誤代碼，以及回報者。",
      },
      {
        text: "選「狀態」，寫「回覆」（1000 字以內），按「儲存」。新的回覆或改成「已解決」「不處理」時，回報者會收到通知，在「我的回報」看到你的回覆。",
      },
    ],
  },
  {
    id: "exports",
    title: "匯出與報表",
    group: "其他",
    roles: ADMIN,
    href: "/admin/exports",
    summary: "把貼文和成員名單下載成 Excel。",
    short: 2,
    steps: [
      {
        text: "「貼文匯出（區間發文）」選開始與結束日期（兩天都包含），按「預覽」再「下載 Excel」：日期、標題、SIG 和發文者。",
      },
      {
        text: "「SIG 成員名單」選一個 SIG，下載學號、姓名、班級和 Email。",
      },
      {
        text: "SIG 的「成員」分頁和活動的報名名單也各有「下載 Excel」「匯出 Excel」。",
      },
    ],
  },
  {
    id: "audit",
    title: "操作紀錄",
    group: "其他",
    roles: ADMIN,
    href: "/admin/audit",
    summary: "管理平台上每個變更是誰、什麼時候做的。",
    short: 2,
    steps: [
      {
        text: "用「動作」「對象」和「只看我的操作」篩選，最新的在最上面。",
      },
      {
        text: "點一筆打開詳細資料，可以「只看 X 的操作」或看「這個對象的所有紀錄」，也能看原始資料。",
      },
      {
        text: "預覽（例如合併、學年交接的檢查）不會留下紀錄。",
      },
    ],
  },
  {
    id: "logins",
    title: "登入紀錄",
    group: "其他",
    roles: ADMIN,
    href: "/admin/logins",
    summary: "全站或一個人的登入時間、方式與裝置。",
    short: 2,
    steps: [
      {
        text: "列出使用者、方式、裝置、IP 雜湊和時間。從使用者的「登入紀錄」打開時只看那個人。",
      },
      {
        text: "紀錄保留 180 天。IP 只存雜湊值，同一個雜湊代表同一個位址。",
      },
    ],
  },
];

export function adminGuide(id: string) {
  return ADMIN_GUIDES.find((guide) => guide.id === id);
}

/** Whether any of the roles can use the feature. */
export function guideFor(guide: { roles: AdminRole[] }, roles: AdminRole[]) {
  return guide.roles.some((role) => roles.includes(role));
}

/** The steps the roles see (steps without `roles` are for everyone). */
export function stepsFor(guide: AdminGuide, roles: AdminRole[] | null) {
  return roles
    ? guide.steps.filter(
        (step) =>
          !step.roles || step.roles.some((role) => roles.includes(role)),
      )
    : guide.steps;
}

/**
 * The guides of an admin page, the first one in the drawer. SIG detail
 * tabs have their own.
 */
export function guidesForPath(pathname: string, tab: string | null): string[] {
  if (pathname.startsWith("/admin/sigs/")) {
    const byTab: Record<string, string[]> = {
      staff: ["sig-staff"],
      members: ["sig-settings"],
      requests: ["join-requests"],
      recruiting: ["sig-recruiting"],
      events: ["sig-events"],
      analytics: ["sig-settings"],
    };
    return (
      byTab[tab ?? ""] ?? [
        "sig-settings",
        "sig-url",
        "sig-archive",
        "sig-staff",
      ]
    );
  }
  const map: Record<string, string[]> = {
    "/admin": ["overview", "traffic"],
    "/admin/posts": ["posts"],
    "/admin/comments": ["comments"],
    "/admin/reports": ["reports"],
    "/admin/keyword-filter": ["keyword-filter"],
    "/admin/sigs": ["sig-settings", "sig-url", "sig-archive", "sig-staff"],
    "/admin/join-requests": ["join-requests"],
    "/admin/users": ["users-suspension", "users-roles", "users-edit"],
    "/admin/rollover": ["rollover"],
    "/admin/badges": ["badges"],
    "/admin/banners": ["banners"],
    "/admin/broadcast": ["broadcast"],
    "/admin/exports": ["exports"],
    "/admin/audit": ["audit"],
    "/admin/logins": ["logins"],
    "/admin/issue-reports": ["issue-reports"],
  };
  return map[pathname.replace(/\/$/, "") || "/admin"] ?? [];
}
